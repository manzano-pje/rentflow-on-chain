// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PropertyRental - Gerencia aluguel de propriedades com taxa de plataforma
/// @notice Suporta cadastro de propriedades, controle de disponibilidade, aluguel com taxa da plataforma e histórico
contract PropertyRental {
    // ===========================
    //            Types
    // ===========================

    struct Property {
        uint256 id;                    // ID único
        address payable owner;         // Endereço do proprietário
        string title;                  // Título
        string description;            // Descrição
        string location;               // Localização
        uint256 pricePerNight;         // Preço por noite em wei
        bool isAvailable;              // Disponibilidade
        uint64 createdAt;              // Timestamp de criação
    }

    struct Rental {
        uint256 propertyId;            // ID da propriedade alugada
        address tenant;                // Endereço do inquilino
        uint64 startDate;              // Data de início (timestamp)
        uint64 endDate;                // Data de fim (timestamp)
        uint256 totalAmount;           // Valor total pago
        uint256 platformFee;           // Taxa da plataforma (em wei)
        bool isActive;                 // Status do aluguel
    }

    // ===========================
    //        State / Storage
    // ===========================

    address public contractOwner;

    // Taxa da plataforma em basis points (bps). 2% = 200 bps.
    // Pode ser alterada até no máximo 10% (1000 bps)
    uint16 public platformFeeBps = 200; // default 2%
    uint16 public constant MAX_PLATFORM_FEE_BPS = 1000; // 10%

    // Rastreamento de propriedades e aluguéis
    uint256 private nextPropertyId = 1;
    uint256 private nextRentalId = 1;

    mapping(uint256 => Property) public propertiesById;
    uint256[] private allPropertyIds;

    mapping(uint256 => Rental) public rentalsById;
    mapping(address => uint256[]) private tenantToRentalIds;
    mapping(uint256 => uint256[]) private propertyToRentalIds;

    // Saldo acumulado de taxas da plataforma (para saque)
    uint256 public platformFeesAccrued;

    // Reentrancy guard
    bool private reentrancyLock;

    // ===========================
    //            Events
    // ===========================

    event PropertyCreated(
        uint256 indexed propertyId,
        address indexed owner,
        string title,
        uint256 pricePerNight
    );

    event PropertyAvailabilityUpdated(
        uint256 indexed propertyId,
        bool isAvailable
    );

    event PropertyPriceUpdated(
        uint256 indexed propertyId,
        uint256 pricePerNight
    );

    event PropertyRented(
        uint256 indexed rentalId,
        uint256 indexed propertyId,
        address indexed tenant,
        uint64 startDate,
        uint64 endDate,
        uint256 totalAmount,
        uint256 platformFee
    );

    event PlatformFeeUpdated(uint16 newFeeBps);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    // ===========================
    //        Modifiers / Auth
    // ===========================

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not contract owner");
        _;
    }

    modifier nonReentrant() {
        require(!reentrancyLock, "Reentrancy");
        reentrancyLock = true;
        _;
        reentrancyLock = false;
    }

    modifier propertyExists(uint256 propertyId) {
        require(propertiesById[propertyId].owner != address(0), "Property not found");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
    }

    // ===========================
    //        Owner (Platform)
    // ===========================

    /// @notice Atualiza a taxa da plataforma (em basis points). Máximo 10%.
    function setPlatformFeeBps(uint16 newFeeBps) external onlyContractOwner {
        require(newFeeBps <= MAX_PLATFORM_FEE_BPS, "Fee too high");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    /// @notice Saque das taxas da plataforma para um endereço
    function withdrawPlatformFees(address payable to, uint256 amount)
        external
        onlyContractOwner
        nonReentrant
    {
        require(to != address(0), "Invalid to");
        require(amount > 0, "Zero amount");
        require(amount <= platformFeesAccrued, "Exceeds accrued");

        platformFeesAccrued -= amount;

        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdraw failed");

        emit PlatformFeesWithdrawn(to, amount);
    }

    /// @notice Função de emergência para retirar todos os fundos do contrato
    function emergencyWithdrawAll(address payable to)
        external
        onlyContractOwner
        nonReentrant
    {
        require(to != address(0), "Invalid to");
        uint256 amount = address(this).balance;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Emergency withdraw failed");
        // Nota: não alteramos platformFeesAccrued aqui; este método é para emergência
        emit EmergencyWithdrawal(to, amount);
    }

    // ===========================
    //       Proprietários
    // ===========================

    /// @notice Cadastra uma nova propriedade disponível para aluguel
    function createProperty(
        string calldata title,
        string calldata description,
        string calldata location,
        uint256 pricePerNight
    ) external returns (uint256 propertyId) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(location).length > 0, "Location required");
        require(pricePerNight > 0, "Price must be > 0");

        propertyId = nextPropertyId++;

        propertiesById[propertyId] = Property({
            id: propertyId,
            owner: payable(msg.sender),
            title: title,
            description: description,
            location: location,
            pricePerNight: pricePerNight,
            isAvailable: true,
            createdAt: uint64(block.timestamp)
        });

        allPropertyIds.push(propertyId);

        emit PropertyCreated(propertyId, msg.sender, title, pricePerNight);
    }

    /// @notice Atualiza disponibilidade da propriedade
    function setPropertyAvailability(uint256 propertyId, bool isAvailable)
        external
        propertyExists(propertyId)
    {
        Property storage prop = propertiesById[propertyId];
        require(msg.sender == prop.owner, "Not property owner");
        prop.isAvailable = isAvailable;
        emit PropertyAvailabilityUpdated(propertyId, isAvailable);
    }

    /// @notice Atualiza o preço por noite de uma propriedade
    function setPropertyPrice(uint256 propertyId, uint256 newPricePerNight)
        external
        propertyExists(propertyId)
    {
        require(newPricePerNight > 0, "Price must be > 0");
        Property storage prop = propertiesById[propertyId];
        require(msg.sender == prop.owner, "Not property owner");
        prop.pricePerNight = newPricePerNight;
        emit PropertyPriceUpdated(propertyId, newPricePerNight);
    }

    // ===========================
    //         Inquilinos
    // ===========================

    /// @notice Lista todas as propriedades disponíveis
    function listAvailableProperties() external view returns (Property[] memory) {
        // Primeiro conta quantas estão disponíveis para alocar o array em memória
        uint256 availableCount = 0;
        uint256 totalCount = allPropertyIds.length;
        for (uint256 i = 0; i < totalCount; i++) {
            uint256 pid = allPropertyIds[i];
            if (propertiesById[pid].isAvailable) {
                availableCount++;
            }
        }

        Property[] memory result = new Property[](availableCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < totalCount; i++) {
            uint256 pid = allPropertyIds[i];
            Property storage prop = propertiesById[pid];
            if (prop.isAvailable) {
                result[idx] = prop;
                idx++;
            }
        }
        return result;
    }

    /// @notice Realiza o aluguel de uma propriedade pagando em ETH
    /// @param propertyId ID da propriedade
    /// @param startDate timestamp de início (inclusivo)
    /// @param endDate timestamp de fim (exclusivo)
    function rentProperty(
        uint256 propertyId,
        uint64 startDate,
        uint64 endDate
    ) external payable nonReentrant propertyExists(propertyId) returns (uint256 rentalId) {
        Property storage prop = propertiesById[propertyId];
        require(prop.isAvailable, "Property not available");
        require(endDate > startDate, "Invalid dates");

        // Calcular numero de noites inteiras
        uint256 secondsDiff = uint256(endDate) - uint256(startDate);
        uint256 nights = secondsDiff / 1 days;
        require(nights > 0, "At least 1 night");

        uint256 totalAmount = nights * prop.pricePerNight;
        require(msg.value == totalAmount, "Incorrect ETH value");

        // Calcular taxa da plataforma
        uint256 fee = (totalAmount * platformFeeBps) / 10_000;
        uint256 payout = totalAmount - fee;

        // Efeitos
        rentalId = nextRentalId++;
        rentalsById[rentalId] = Rental({
            propertyId: propertyId,
            tenant: msg.sender,
            startDate: startDate,
            endDate: endDate,
            totalAmount: totalAmount,
            platformFee: fee,
            isActive: true
        });
        tenantToRentalIds[msg.sender].push(rentalId);
        propertyToRentalIds[propertyId].push(rentalId);
        platformFeesAccrued += fee;

        emit PropertyRented(
            rentalId,
            propertyId,
            msg.sender,
            startDate,
            endDate,
            totalAmount,
            fee
        );

        // Interações (transferência para o proprietário)
        (bool success, ) = prop.owner.call{value: payout}("");
        require(success, "Payout failed");
    }

    // ===========================
    //            Views
    // ===========================

    function getProperty(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (Property memory)
    {
        return propertiesById[propertyId];
    }

    function getAllPropertyIds() external view returns (uint256[] memory) {
        return allPropertyIds;
    }

    function getPropertiesByOwner(address ownerAddr)
        external
        view
        returns (Property[] memory)
    {
        uint256 totalCount = allPropertyIds.length;
        uint256 count = 0;
        for (uint256 i = 0; i < totalCount; i++) {
            if (propertiesById[allPropertyIds[i]].owner == ownerAddr) {
                count++;
            }
        }

        Property[] memory result = new Property[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < totalCount; i++) {
            uint256 pid = allPropertyIds[i];
            if (propertiesById[pid].owner == ownerAddr) {
                result[idx] = propertiesById[pid];
                idx++;
            }
        }
        return result;
    }

    function getTenantRentals(address tenant)
        external
        view
        returns (Rental[] memory)
    {
        uint256[] storage ids = tenantToRentalIds[tenant];
        uint256 len = ids.length;
        Rental[] memory result = new Rental[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = rentalsById[ids[i]];
        }
        return result;
    }

    function getPropertyRentals(uint256 propertyId)
        external
        view
        returns (Rental[] memory)
    {
        uint256[] storage ids = propertyToRentalIds[propertyId];
        uint256 len = ids.length;
        Rental[] memory result = new Rental[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = rentalsById[ids[i]];
        }
        return result;
    }

    /// @notice Retorna o número de noites baseado em início e fim
    function previewNights(uint64 startDate, uint64 endDate) external pure returns (uint256) {
        if (endDate <= startDate) return 0;
        return (uint256(endDate) - uint256(startDate)) / 1 days;
    }

    /// @notice Retorna o valor total e a taxa considerando uma propriedade e um período
    function quoteRental(uint256 propertyId, uint64 startDate, uint64 endDate)
        external
        view
        propertyExists(propertyId)
        returns (uint256 totalAmount, uint256 fee, uint256 payout)
    {
        uint256 nights = (uint256(endDate) - uint256(startDate)) / 1 days;
        if (endDate <= startDate || nights == 0) {
            return (0, 0, 0);
        }
        totalAmount = nights * propertiesById[propertyId].pricePerNight;
        fee = (totalAmount * platformFeeBps) / 10_000;
        payout = totalAmount - fee;
    }

    // ===========================
    //        Utils / Receive
    // ===========================

    receive() external payable {}

    fallback() external payable {}
}