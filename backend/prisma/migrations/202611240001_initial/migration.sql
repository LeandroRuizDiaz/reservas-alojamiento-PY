-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cabana` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `capacidad` INTEGER NOT NULL,
    `precioNoche` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Huesped` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `documento` VARCHAR(30) NOT NULL,
    `telefono` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `Huesped_documento_key`(`documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cabanaId` INTEGER NOT NULL,
    `huespedId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `entrada` DATE NOT NULL,
    `salida` DATE NOT NULL,
    `personas` INTEGER NOT NULL,
    `tarifaNoche` DECIMAL(12, 2) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'Confirmada',
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Reserva_cabanaId_entrada_salida_idx`(`cabanaId`, `entrada`, `salida`),
    INDEX `Reserva_huespedId_idx`(`huespedId`),
    INDEX `Reserva_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_cabanaId_fkey` FOREIGN KEY (`cabanaId`) REFERENCES `Cabana`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_huespedId_fkey` FOREIGN KEY (`huespedId`) REFERENCES `Huesped`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

