-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql-teuss.alwaysdata.net
-- Generation Time: Dec 09, 2025 at 06:16 PM
-- Server version: 10.11.14-MariaDB
-- PHP Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `teuss_phone_shop`
--

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `product_id`, `title`, `subtitle`, `display_order`, `is_active`, `created_at`) VALUES
('7f1e86b5-097a-430d-9408-d7bca7eac567', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'Nouveau testeeeee', '15% de reduction', 5, 1, '2025-11-12 14:10:22'),
('cfaa229d-b8c1-48db-a1ea-12e136537e8f', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'Offre spéciale', 2, 1, '2025-11-12 12:41:44');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
('9601c058-53dd-40c5-a9aa-15c329fc8de7', 'f01ffc62-f214-47ea-abcd-d7641db2a797', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 1, '2025-11-12 15:03:56', '2025-11-12 15:03:56');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `product_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `product_count`) VALUES
('677faca7-ef00-4730-a9f0-3b8261127732', 'Smartphones', 'smartphones', 'Smartphone', 0),
('6ebfccd6-931d-42b0-bc87-790039e3946f', 'Accessoires', 'accessories', 'Headphones', 0),
('c3642266-26a0-4b7e-b1d4-d882c5375068', 'Tablettes', 'tablets', 'Tablet', 0),
('ccfd0a50-33b8-478f-95bb-abc1ea7776a4', 'test', 'default-slug', NULL, 0),
('ef2de43c-eb3e-4de4-81a7-e483622f7e84', 'Montres connectées', 'smartwatches', 'Watch', 0);

-- --------------------------------------------------------

--
-- Table structure for table `flash_sales`
--

CREATE TABLE `flash_sales` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `original_price` decimal(10,2) NOT NULL,
  `sale_price` decimal(10,2) NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `stock_limit` int(11) DEFAULT NULL,
  `sold_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `flash_sales`
--

INSERT INTO `flash_sales` (`id`, `product_id`, `original_price`, `sale_price`, `start_time`, `end_time`, `stock_limit`, `sold_count`, `is_active`) VALUES
('5e535efb-f2f2-4d05-85fc-8360249799dc', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 10000.00, 1000.00, '2025-11-12 13:43:00', '2025-11-30 13:43:00', 1, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL COMMENT 'UUID unique de la facture',
  `invoice_number` varchar(50) NOT NULL COMMENT 'Numéro de facture (ex: INV-12345678)',
  `order_id` varchar(36) DEFAULT NULL COMMENT 'ID de commande associée (optionnel)',
  `user_id` varchar(36) DEFAULT NULL COMMENT 'ID utilisateur (optionnel pour factures manuelles)',
  `customer_name` varchar(255) NOT NULL COMMENT 'Nom complet du client',
  `customer_email` varchar(255) NOT NULL COMMENT 'Email du client',
  `customer_phone` varchar(50) DEFAULT NULL COMMENT 'Téléphone du client',
  `customer_address` varchar(500) DEFAULT NULL COMMENT 'Adresse complète du client',
  `customer_city` varchar(100) DEFAULT NULL COMMENT 'Ville du client',
  `amount` decimal(10,2) NOT NULL COMMENT 'Montant total HT (sous-total)',
  `tax` decimal(10,2) NOT NULL COMMENT 'Montant de la TVA',
  `tax_rate` decimal(5,2) DEFAULT 20.00 COMMENT 'Taux de TVA en pourcentage',
  `discount` decimal(10,2) DEFAULT 0.00 COMMENT 'Montant de la réduction',
  `total` decimal(10,2) NOT NULL COMMENT 'Montant total TTC',
  `status` enum('paid','pending','cancelled') DEFAULT 'pending' COMMENT 'Statut de la facture',
  `payment_method` enum('cash_on_delivery','card','bank_transfer','other') DEFAULT 'cash_on_delivery' COMMENT 'Méthode de paiement',
  `payment_date` datetime DEFAULT NULL COMMENT 'Date de paiement (si payée)',
  `notes` text DEFAULT NULL COMMENT 'Notes ou commentaires additionnels',
  `qr_code` text DEFAULT NULL COMMENT 'Données du QR code encodées',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date de création',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Date de dernière modification'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des factures';

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `order_id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `customer_city`, `amount`, `tax`, `tax_rate`, `discount`, `total`, `status`, `payment_method`, `payment_date`, `notes`, `qr_code`, `created_at`, `updated_at`) VALUES
('086654ce-6e26-420d-8a42-ee6779d9eb69', 'INV-202511-0304', NULL, NULL, 'aa', 'ff', '+221784448928', 'Cité Hamo 3', 'Dakar', 2999.88, 0.00, 0.00, 1000.00, 1999.88, 'paid', 'card', '2025-11-20 16:09:08', 'qsdfghjklm', NULL, '2025-11-20 17:09:09', '2025-11-20 17:09:09'),
('368bc7df-aa5d-4a2b-ae2c-0fa0964fb859', 'INV-519859AE', NULL, NULL, 'Talla Ndiaye', 'ndiayetalla928@gmail.com', '+221784448928', 'Cité Hamo 3', 'Dakar', 1799.97, 0.00, 0.00, 0.00, 1799.97, 'paid', 'cash_on_delivery', '2025-11-21 07:28:51', NULL, NULL, '2025-11-21 08:28:52', '2025-11-21 08:28:52'),
('38228a01-8aed-43ea-b2bf-db579bfd488c', 'INV-301A51FD', NULL, NULL, 'Talla Ndiaye', 'ndiayetalla928@gmail.com', '+221784448928', 'Cité Hamo 3', 'Dakar', 849.98, 0.00, 0.00, 0.00, 849.98, 'pending', 'cash_on_delivery', NULL, NULL, NULL, '2025-11-21 08:53:07', '2025-11-21 08:53:07'),
('70f4098e-9a3b-405e-92dc-980147d2df2b', 'INV-1CA9282E', NULL, NULL, 'Moussa Diop ', 'diourbel200901@gmail.com', '78282882&2&2', 'Feusbjsbeshsbe', 'Dajmsms', 10000.00, 2000.00, 20.00, 0.00, 12000.00, 'paid', 'cash_on_delivery', '2025-11-14 05:30:22', 'Ha shshshsnsns ', NULL, '2025-11-14 05:30:22', '2025-11-14 05:30:22'),
('820257b8-960e-419c-b02a-60a160c43ec1', 'INV-4599C543', NULL, NULL, 'Talla Ndiaye', 'ndiayetalla928@gmail.com', '+221784448928', 'Cité Hamo 3', 'Dakar', 11349.98, 0.00, 0.00, 0.00, 11349.98, 'paid', '', '2025-11-21 07:59:33', NULL, NULL, '2025-11-21 08:59:33', '2025-11-21 08:59:33'),
('82949eb3-9f34-4b17-b6af-2ce4dfa9edd8', 'INV-DFEABD78', NULL, NULL, 'Talla Ndiaye', 'ndiayetalla928@gmail.com', '784448928', 'Cité Hamo 3', 'Dakar', 100000.00, 20000.00, 20.00, 0.00, 120000.00, 'pending', 'other', NULL, NULL, NULL, '2025-11-14 23:03:21', '2025-11-14 23:03:21'),
('b9b45ea0-23ae-49a4-831a-3ad9478313ad', 'INV-854C31D2', NULL, NULL, 'Talla Ndiaye', 'ndiayetalla928@gmail.com', '784448928', 'Cité Hamo 3', 'Dakar', 1000.00, 200.00, 20.00, 0.00, 1200.00, 'paid', 'other', '2025-11-13 15:15:19', 'teste', NULL, '2025-11-13 16:15:21', '2025-11-13 16:15:21');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` varchar(36) NOT NULL COMMENT 'UUID unique de l''article',
  `invoice_id` varchar(36) NOT NULL COMMENT 'ID de la facture parente',
  `product_id` varchar(36) DEFAULT NULL COMMENT 'ID du produit (optionnel pour articles manuels)',
  `product_name` varchar(255) NOT NULL COMMENT 'Nom de l''article',
  `product_image` varchar(500) DEFAULT NULL COMMENT 'URL de l''image du produit',
  `unit_price` decimal(10,2) NOT NULL COMMENT 'Prix unitaire HT',
  `quantity` int(11) NOT NULL COMMENT 'Quantité commandée',
  `total` decimal(10,2) NOT NULL COMMENT 'Total ligne (prix unitaire × quantité)',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date d''ajout de l''article'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des articles de factures';

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `product_name`, `product_image`, `unit_price`, `quantity`, `total`, `created_at`) VALUES
('0744f235-ff69-4e63-922a-6402ecb8a7f1', '820257b8-960e-419c-b02a-60a160c43ec1', NULL, 'Samsung Galaxy S24 Ultra', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', 1099.99, 1, 1099.99, '2025-11-21 08:59:33'),
('1598842b-b6e9-494e-a27d-407b6e6b28af', 'b9b45ea0-23ae-49a4-831a-3ad9478313ad', NULL, 'Talla Ndiaye', NULL, 10.00, 100, 1000.00, '2025-11-13 16:15:21'),
('3464b3cf-265f-4c1a-bbb0-534851350310', '820257b8-960e-419c-b02a-60a160c43ec1', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 10000.00, 1, 10000.00, '2025-11-21 08:59:33'),
('3b2ebd6f-afcf-424d-99a2-ab73cf938407', '82949eb3-9f34-4b17-b6af-2ce4dfa9edd8', NULL, 'moussa', NULL, 1000.00, 100, 100000.00, '2025-11-14 23:03:21'),
('51bda355-caf0-4f09-b80f-66bd7a069b0f', '38228a01-8aed-43ea-b2bf-db579bfd488c', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', 249.99, 1, 249.99, '2025-11-21 08:53:07'),
('6b37e7d5-8134-4d93-95b1-03065b2edaf8', '820257b8-960e-419c-b02a-60a160c43ec1', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', 249.99, 1, 249.99, '2025-11-21 08:59:33'),
('84e82c9a-1b64-4b8d-9a0a-1759cd7256a8', '70f4098e-9a3b-405e-92dc-980147d2df2b', NULL, 'iPhone 11', NULL, 1000.00, 10, 10000.00, '2025-11-14 05:30:22'),
('9179b3d8-625e-4bf3-8fcf-b37b41a1e7e0', '38228a01-8aed-43ea-b2bf-db579bfd488c', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 599.99, 1, 599.99, '2025-11-21 08:53:07'),
('b188248e-18f3-4e9e-9021-f79193d40569', '368bc7df-aa5d-4a2b-ae2c-0fa0964fb859', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 599.99, 3, 1799.97, '2025-11-21 08:28:52'),
('de03914f-227a-4173-ae6a-aace5d87db1e', '086654ce-6e26-420d-8a42-ee6779d9eb69', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', 249.99, 12, 2999.88, '2025-11-20 17:09:09');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `total` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `final_total` decimal(10,2) DEFAULT 0.00,
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`shipping_address`)),
  `payment_method` varchar(50) DEFAULT NULL,
  `voucher_code` varchar(50) DEFAULT NULL,
  `loyalty_points_earned` int(11) DEFAULT 0,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_status` varchar(30) DEFAULT 'pending',
  `payment_ref` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `status`, `total`, `discount`, `final_total`, `shipping_address`, `payment_method`, `voucher_code`, `loyalty_points_earned`, `discount_amount`, `created_at`, `updated_at`, `payment_status`, `payment_ref`) VALUES
('00f40ba4-f734-4709-afaa-40a04a25da63', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:04:34', '2025-11-26 03:04:34', 'pending', NULL),
('03d0c157-55ae-45b3-9b7b-4cf03b200561', NULL, 'pending', 10000.00, 0.00, 10000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:46:33', '2025-11-26 02:46:33', 'pending', NULL),
('0610020a-ead4-413a-8689-adfd10bf209d', NULL, 'delivered', 10400.00, 0.00, 10400.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+1784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', 'Wave', NULL, 0, 0.00, '2025-11-26 15:41:57', '2025-12-09 16:40:05', 'paid', 'wxcvb4447'),
('0732561c-d4c0-44bb-b6dd-fc19806e25d4', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+3784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:01:16', '2025-11-26 15:01:16', 'pending', NULL),
('18d6b182-f2b9-4011-b1e5-e178e2b17700', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:25:32', '2025-11-26 02:25:32', 'pending', NULL),
('2435d95d-56d6-4e75-bc0a-db70fc1dad40', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 16899.94, 0.00, 16899.94, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 3, 0.00, '2025-11-21 17:54:06', '2025-11-21 17:54:06', 'pending', NULL),
('26867981-2abd-4fc5-bd1b-8e30b843e56d', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:03:57', '2025-11-26 03:03:57', 'pending', NULL),
('29931985-91f9-40c5-aaeb-68596ad381f6', NULL, 'pending', 400.00, 0.00, 450.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:04:48', '2025-11-26 15:04:48', 'pending', NULL),
('2bbfc92a-14bd-4ec7-a7e4-a93d3e2b6c0a', NULL, 'pending', 10000.00, 0.00, 10000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:09:21', '2025-11-26 02:09:21', 'pending', NULL),
('34f5adfe-9821-479f-a682-8b9aa255826c', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:13:10', '2025-11-26 02:13:10', 'pending', NULL),
('3adb24e0-5911-4ce6-97b3-684d3b959f0f', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:12:26', '2025-11-26 03:12:26', 'pending', NULL),
('488131ce-6d11-4d05-a857-21b578acda35', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:13:00', '2025-11-26 02:13:00', 'pending', NULL),
('5231e596-7329-49a6-b067-cfd421740ca5', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 20000.00, 1500.00, 18500.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Dakar\", \"city\": \"Dakar\"}', NULL, 'MATH', 1850, 0.00, '2025-11-14 18:01:33', '2025-11-14 18:01:33', 'pending', NULL),
('657bfa66-cb62-4c1d-b678-d2aba17eecdf', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:47:03', '2025-11-26 02:47:03', 'pending', NULL),
('69629cf8-3053-44aa-89a1-dfb6c6bd8107', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 10000.00, 0.00, 10000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 1000, 0.00, '2025-11-21 17:50:42', '2025-11-21 17:50:42', 'pending', NULL),
('6eaf79bc-a627-44c2-941e-c6ca88e0ac1d', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 16999.60, 1500.00, 15499.60, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, 'MATH', 0, 0.00, '2025-11-14 17:44:15', '2025-11-14 17:44:15', 'pending', NULL),
('712c48a2-ae8b-4618-a917-082d90cb2e1b', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:36:26', '2025-11-26 02:36:26', 'pending', NULL),
('738345be-5651-4769-bc7a-700b29abf8d7', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+3784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 14:57:12', '2025-11-26 14:57:12', 'pending', NULL),
('73df9f18-5065-43aa-8c5e-1ad6deeb4b6c', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:39:44', '2025-11-26 02:39:44', 'pending', NULL),
('784c1abc-32bd-49d5-8765-c6f6f1ea564f', NULL, 'pending', 400.00, 0.00, 450.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:02:48', '2025-11-26 15:02:48', 'pending', NULL),
('7e91df9f-851a-49c9-a574-b762d3afbca7', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:19:24', '2025-11-26 02:19:24', 'pending', NULL),
('a57d7719-3d35-41ab-8a0c-f6901fb22e20', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 15499.95, 0.00, 15499.95, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 3, 0.00, '2025-11-21 17:59:50', '2025-11-21 17:59:50', 'pending', NULL),
('a6d9027d-447d-4b06-8c23-b8311167fa3d', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:10:20', '2025-11-26 03:10:20', 'pending', NULL),
('ad6ddeb2-f905-4bb1-a7f2-70e5b3e87e73', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:59:20', '2025-11-26 02:59:20', 'pending', NULL),
('bb6b9665-9968-4c63-927c-4cc5964b6b11', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:33:10', '2025-11-26 02:33:10', 'pending', NULL),
('bd94202e-b867-4785-9e62-b56574484a56', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 14:59:32', '2025-11-26 14:59:32', 'pending', NULL),
('bf91096e-9c5c-4250-bcd2-ba064dc306b9', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:25:56', '2025-11-26 03:25:56', 'pending', NULL),
('c72713a8-1cab-4ecd-9fb4-3a0bfbc1ee2f', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:49:39', '2025-11-26 02:49:39', 'pending', NULL),
('c78e6bd2-5b67-467b-9680-11989d776c0a', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 10000.00, 1000.00, 9000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, 'WELCOME10', 900, 0.00, '2025-11-14 15:29:40', '2025-11-14 15:29:40', 'pending', NULL),
('d525db5a-5a91-440c-aee7-ec48a6b82073', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:00:15', '2025-11-26 15:00:15', 'pending', NULL),
('e321317d-59f7-4b9d-b203-3123fafe4ef2', NULL, 'pending', 10000.00, 0.00, 10000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:24:20', '2025-11-26 02:24:20', 'pending', NULL),
('e7171cfd-ccef-408f-a773-34e66161f66b', NULL, 'pending', 10000.00, 0.00, 10000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+784448928\", \"address\": \"Guediawaye\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:01:54', '2025-11-26 15:01:54', 'pending', NULL),
('ec900b6e-9d3b-4c71-8321-3d5feeeae0fd', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:09:10', '2025-11-26 03:09:10', 'pending', NULL),
('ee353003-68f7-457e-8654-b67e882c3035', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 15:00:37', '2025-11-26 15:00:37', 'pending', NULL),
('ef660626-fdf8-4b1c-a689-b03e7d0782d0', NULL, 'pending', 10599.99, 0.00, 10599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 02:54:52', '2025-11-26 02:54:52', 'pending', NULL),
('f7698715-7374-40ed-901d-837d406aaa9b', NULL, 'pending', 599.99, 0.00, 599.99, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cite Hamo 3\", \"city\": \"Dakar\"}', NULL, NULL, 0, 0.00, '2025-11-26 03:26:18', '2025-11-26 03:26:18', 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` text DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_image`, `quantity`, `price`) VALUES
('010b4dfd-5627-4a74-acfb-d16a76e8cd2e', '0610020a-ead4-413a-8689-adfd10bf209d', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'Talla Ndiaye', 'ssssssssssa', 1, 400.00),
('0566e7d2-162f-47af-86bb-9020b367f535', 'ad6ddeb2-f905-4bb1-a7f2-70e5b3e87e73', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('05d18e53-1875-443a-8eed-d1d5f2a805a1', 'c78e6bd2-5b67-467b-9680-11989d776c0a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'imphone d talla', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('082053b7-f503-436e-a3b3-0159ae618053', 'bb6b9665-9968-4c63-927c-4cc5964b6b11', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('09616184-69ab-44cd-bacb-b9b034e1e535', 'e321317d-59f7-4b9d-b203-3123fafe4ef2', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('0c832474-f690-4b97-8ca8-e7f34072a544', 'ef660626-fdf8-4b1c-a689-b03e7d0782d0', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPhone 16', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('114c7c47-dcc6-4de0-ba20-abfef199dbef', '69629cf8-3053-44aa-89a1-dfb6c6bd8107', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('12ba8d94-a85b-4e95-95ca-7bfaf2f93349', 'c72713a8-1cab-4ecd-9fb4-3a0bfbc1ee2f', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('1bd8da06-27a5-4c59-b7ec-e11b47891994', '0732561c-d4c0-44bb-b6dd-fc19806e25d4', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('24fce1de-8f94-4d90-9306-2c657470dc62', 'bb6b9665-9968-4c63-927c-4cc5964b6b11', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('2e82e938-55bd-42c4-9ac7-2bd37a42b8bb', '784c1abc-32bd-49d5-8765-c6f6f1ea564f', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'Talla Ndiaye', 'ssssssssssa', 1, 400.00),
('351f86a5-ecd3-46f4-915c-a5f620c29c28', '0610020a-ead4-413a-8689-adfd10bf209d', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('3f9ca154-69ac-4adf-9be7-6dcb9cf0f7c1', 'ee353003-68f7-457e-8654-b67e882c3035', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('40d13d48-accb-4935-aaa5-e4f9bd911cee', '34f5adfe-9821-479f-a682-8b9aa255826c', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('4274052e-9933-4c25-8909-5e70e46b3368', '657bfa66-cb62-4c1d-b678-d2aba17eecdf', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('4a0b2b4a-ea84-4599-bd2f-52095ee0bbe3', '2435d95d-56d6-4e75-bc0a-db70fc1dad40', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('4e3ebbda-2fd6-4875-a559-952bf8ed9498', '73df9f18-5065-43aa-8c5e-1ad6deeb4b6c', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('52d3434b-ef51-48d4-b376-9ebd2353ed59', 'bd94202e-b867-4785-9e62-b56574484a56', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('5310dbeb-8a1e-4f7f-8304-6a18f2ecd75d', '712c48a2-ae8b-4618-a917-082d90cb2e1b', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('576d5589-8399-4a5d-84d2-5b99b6dd91b9', 'f7698715-7374-40ed-901d-837d406aaa9b', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('59894692-c5a2-4c79-80de-4230489a1f3e', '5231e596-7329-49a6-b067-cfd421740ca5', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 2, 10000.00),
('5eca27c4-9c07-415f-b83a-bbf05023ee6e', 'ee353003-68f7-457e-8654-b67e882c3035', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('6284aa6d-6bde-44c5-92ea-ac140929dd55', '738345be-5651-4769-bc7a-700b29abf8d7', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('655efd2f-b87c-4863-9f59-1d6515de9bd6', '26867981-2abd-4fc5-bd1b-8e30b843e56d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('6fde28a7-e2b9-4e05-bd79-6975d9dcd17c', '29931985-91f9-40c5-aaeb-68596ad381f6', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'Talla Ndiaye', 'ssssssssssa', 1, 400.00),
('76b65f0c-2293-490c-9ce0-65a371845c7a', '7e91df9f-851a-49c9-a574-b762d3afbca7', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('8081af7e-99b0-4873-9bc0-536a05901e8e', 'd525db5a-5a91-440c-aee7-ec48a6b82073', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('892e766e-a6dc-4259-beba-f68363bde4d2', 'd525db5a-5a91-440c-aee7-ec48a6b82073', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('8ef4d4e3-6209-4be3-b5c8-8f3e40217fdd', 'ec900b6e-9d3b-4c71-8321-3d5feeeae0fd', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('903f917b-1ecf-4e18-a31c-a8e44cc31dd8', 'a6d9027d-447d-4b06-8c23-b8311167fa3d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('90b14fd2-8ace-473b-8547-c3fbeaadc04e', '73df9f18-5065-43aa-8c5e-1ad6deeb4b6c', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('9418665a-4946-4755-a631-90f7372aff36', '712c48a2-ae8b-4618-a917-082d90cb2e1b', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('962161df-9936-4288-8317-2afce2061197', '3adb24e0-5911-4ce6-97b3-684d3b959f0f', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('98fba0f3-4998-4e28-9029-eb232197d90c', '2bbfc92a-14bd-4ec7-a7e4-a93d3e2b6c0a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('998eb31b-9f01-4d4a-a816-50d80f2a6fcc', '488131ce-6d11-4d05-a857-21b578acda35', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('9e87f894-eaee-4599-b868-28034178805d', '18d6b182-f2b9-4011-b1e5-e178e2b17700', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('a3d967a7-3f92-4de4-8556-ab341ce16bbb', 'e7171cfd-ccef-408f-a773-34e66161f66b', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('ac8924b7-2219-49e0-b3f7-d68865059539', 'bd94202e-b867-4785-9e62-b56574484a56', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('aecb9b41-d30d-4caa-afbe-2dbe4e730189', '657bfa66-cb62-4c1d-b678-d2aba17eecdf', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('b0166492-2034-437e-b226-94ed092a74fc', '2435d95d-56d6-4e75-bc0a-db70fc1dad40', NULL, 'Samsung Galaxy S24 Ultra', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', 3, 1099.99),
('b7d18712-8a71-4db8-bbd5-81102901b1e5', 'a57d7719-3d35-41ab-8a0c-f6901fb22e20', NULL, 'Samsung Galaxy S24 Ultra', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', 5, 1099.99),
('b9e9b08e-22c0-4392-bd60-20cc1aaec474', '00f40ba4-f734-4709-afaa-40a04a25da63', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('bc3fedf4-3eda-45ca-98f9-2c9965149baa', '03d0c157-55ae-45b3-9b7b-4cf03b200561', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('dc0dcf9c-6037-4b0e-a73d-01b129da25a5', '738345be-5651-4769-bc7a-700b29abf8d7', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('dd9e253a-ae61-4600-85b8-b3331fd1596d', '2435d95d-56d6-4e75-bc0a-db70fc1dad40', NULL, 'iPhone 15 Pro Max', 'https://images.unsplash.com/photo-1696446702061-cbd8e7e14c9e', 3, 1199.99),
('dfed281a-b109-4162-b285-ec23511d5a05', 'c72713a8-1cab-4ecd-9fb4-3a0bfbc1ee2f', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('e2d43db0-0efa-43ca-b242-3f21e7a8472b', '18d6b182-f2b9-4011-b1e5-e178e2b17700', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('e4fd00e1-3358-4044-8290-4dd9153bee72', 'ef660626-fdf8-4b1c-a689-b03e7d0782d0', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('f47707f0-2728-458a-ab98-065dd8e6d784', 'bf91096e-9c5c-4250-bcd2-ba064dc306b9', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 1, 599.99),
('f4b5bd0a-0b9e-4e70-9371-c00dc7e187ea', 'a57d7719-3d35-41ab-8a0c-f6901fb22e20', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES
('4a30c217-c4d7-11f0-9a39-525400354254', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'fwuOdm87zDeRpXvCfdOXyC6pn_g4CIoo4AHW2iaWfrzulJep-ORyA3g9hE0WwPTR', '2025-11-19 00:35:38', 0, '2025-11-19 00:35:39'),
('74da9967-c48c-11f0-9a39-525400354254', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'g3Xrd2FESW8YtZkO8ulpC-HBXtz-4KB2cqr7k9ebw_zfeq2GsekNt0mFioASH1uW', '2025-11-18 15:39:57', 0, '2025-11-18 15:39:58'),
('a91ae56e-c4d5-11f0-9a39-525400354254', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'sUBiYnrybNQ3zeRMU3OU_4eD77EqVR_mjiUHVfmoIoJqaRRcrx8ghYaBICaQje7G', '2025-11-19 00:23:58', 1, '2025-11-19 00:23:59');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `payment_ref` varchar(100) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'XOF',
  `status` enum('pending','paid','failed','canceled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `payment_ref`, `payment_method`, `amount`, `currency`, `status`, `created_at`, `updated_at`) VALUES
(2, 'e321317d-59f7-4b9d-b203-3123fafe4ef2', 'ORDER_e321317d-59f7-4b9d-b203-3123fafe4ef2_1764123862', 'Orange Money', 10000.00, 'XOF', 'pending', '2025-11-26 02:24:24', '2025-11-26 02:24:24'),
(3, '03d0c157-55ae-45b3-9b7b-4cf03b200561', 'ORDER_03d0c157-55ae-45b3-9b7b-4cf03b200561_1764125195', 'Orange Money', 10000.00, 'XOF', 'pending', '2025-11-26 02:46:37', '2025-11-26 02:46:37'),
(4, 'ef660626-fdf8-4b1c-a689-b03e7d0782d0', 'ORDER_ef660626-fdf8-4b1c-a689-b03e7d0782d0_1764125697', 'Orange Money', 10599.99, 'XOF', 'pending', '2025-11-26 02:54:59', '2025-11-26 02:54:59'),
(5, 'a6d9027d-447d-4b06-8c23-b8311167fa3d', 'ORDER_a6d9027d-447d-4b06-8c23-b8311167fa3d_1764126622', 'Orange Money', 599.99, 'XOF', 'pending', '2025-11-26 03:10:24', '2025-11-26 03:10:24'),
(8, 'bf91096e-9c5c-4250-bcd2-ba064dc306b9', 'ORDER_bf91096e-9c5c-4250-bcd2-ba064dc306b9_1764127558', 'wave', 599.99, 'XOF', 'pending', '2025-11-26 03:26:00', '2025-11-26 03:26:00'),
(9, 'f7698715-7374-40ed-901d-837d406aaa9b', 'ORDER_f7698715-7374-40ed-901d-837d406aaa9b_1764127581', 'online', 599.99, 'XOF', 'pending', '2025-11-26 03:26:23', '2025-11-26 03:26:23'),
(10, '29931985-91f9-40c5-aaeb-68596ad381f6', 'ORDER_29931985-91f9-40c5-aaeb-68596ad381f6_1764169490', 'online', 450.00, 'XOF', 'pending', '2025-11-26 15:04:52', '2025-11-26 15:04:52'),
(13, '0610020a-ead4-413a-8689-adfd10bf209d', 'ORDER_0610020a-ead4-413a-8689-adfd10bf209d_1764171722', 'online', 10400.00, 'XOF', 'pending', '2025-11-26 15:42:04', '2025-11-26 15:42:04');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `stock` int(11) DEFAULT 0,
  `rating` decimal(2,1) DEFAULT 0.0,
  `reviews_count` int(11) DEFAULT 0,
  `brand` varchar(100) DEFAULT NULL,
  `specifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specifications`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `original_price`, `category_id`, `image_url`, `images`, `stock`, `rating`, `reviews_count`, `brand`, `specifications`, `is_featured`, `created_at`, `updated_at`) VALUES
('8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'Tablette puissante avec puce M1', 599.99, NULL, 'c3642266-26a0-4b7e-b1d4-d882c5375068', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', '[\"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0\"]', 10, 4.7, 0, 'Apple', '{\"brand\": \"Apple\"}', 1, '2025-11-12 12:41:43', '2025-12-09 17:03:29'),
('98187c91-31fa-48c7-88ec-f3f36ba929bc', 'Talla Ndiaye', 'aaaaaaaaaaaaaaa', 400.00, NULL, '6ebfccd6-931d-42b0-bc87-790039e3946f', 'ssssssssssa', '[\"ssssssssssa\", \"ssssssssssaa\", \"sssssssssaaa\"]', 0, 0.0, 0, 'zsedrfgth', '{}', 0, '2025-11-22 20:05:43', '2025-11-26 15:38:12'),
('b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'teste', 10000.00, 10000.00, '6ebfccd6-931d-42b0-bc87-790039e3946f', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', '[\"https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR\"]', 0, 0.0, 0, 'Apple', '{}', 0, '2025-11-12 13:50:52', '2025-11-26 15:05:51'),
('cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'Écouteurs sans fil avec réduction de bruit', 249.99, NULL, '6ebfccd6-931d-42b0-bc87-790039e3946f', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', '[\"https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7\"]', 98, 4.6, 0, 'Apple', '{\"brand\": \"Apple\"}', 1, '2025-11-12 12:41:43', '2025-11-22 02:16:43');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `movement_type` enum('in','out','return','adjustment') NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `new_stock`, `reason`, `user_id`, `created_at`) VALUES
('011c1aa5-3562-49e6-bc84-0db94ba75b87', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 8, 7, 'Commande #cbac01d8', NULL, '2025-11-26 02:13:29'),
('07a43d08-a45b-4622-87e2-68d08e22bbd9', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 4, 3, 'Commande #dd09eba2', NULL, '2025-11-26 14:16:00'),
('082ce164-bb7e-47d3-9f84-279fcbe3a49d', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 5, 4, 'Commande #d525db5a', NULL, '2025-11-26 14:00:20'),
('10313f6f-4e9e-4b6a-b26e-075c7d7ebecc', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 7, 6, 'Commande #738345be', NULL, '2025-11-26 13:57:17'),
('1169876b-663c-480e-9cd6-7c0434687626', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 1, 0, 'Commande #738345be', NULL, '2025-11-26 13:57:20'),
('1677b76e-d541-43fb-95ff-511992050cfa', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #0610020a', NULL, '2025-11-26 14:42:02'),
('167bc904-c8ca-4378-9af4-98ba617103c3', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 9, 8, 'Commande #29931985', NULL, '2025-11-26 14:04:50'),
('1fe7278a-909f-40f8-9690-40e3877bdae7', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #7c60aa52', NULL, '2025-11-26 14:38:14'),
('228a7ea3-986b-4e4a-b2ef-13cc9f7522db', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 10, 9, 'Commande #03d0c157', NULL, '2025-11-26 01:46:34'),
('230904e0-f951-4ff0-bb97-4ead7502e9cf', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 20, 19, 'Commande #712c48a2', NULL, '2025-11-26 01:36:28'),
('23a006d8-31ee-4ca6-920a-60d1c258f8d8', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 7, 6, 'Commande #77b8e10b', NULL, '2025-11-26 14:08:37'),
('258c877d-d483-4d87-b2c9-4c49a645e76a', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 0, 0, 'Commande #d525db5a', NULL, '2025-11-26 14:00:22'),
('25daabf9-39bf-4f0c-9784-79f2f305f9ce', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 16, 15, 'Commande #ad6ddeb2', NULL, '2025-11-26 01:59:22'),
('2b54a317-a319-4c3d-939f-16f6beb8c35d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 0, 0, 'Commande #bd94202e', NULL, '2025-11-26 13:59:42'),
('2f04b23b-72f2-4a9a-8d6d-0aefcfb12e6f', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 14, 13, 'Commande #18d6b182', NULL, '2025-11-26 01:25:37'),
('36b1df53-b262-43d5-a269-04751f2a0190', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 3, 2, 'Commande #72ac3968', NULL, '2025-11-26 14:23:44'),
('3a03b034-4d1f-4d6b-8843-49c53b1ffa70', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 21, 20, 'Commande #bb6b9665', NULL, '2025-11-26 01:33:13'),
('3dbec3db-508f-477b-b360-15c6c14662e6', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 5, 4, 'Commande #0e492602', NULL, '2025-11-26 02:16:21'),
('42455078-10a2-458f-a76a-3c4f3505323d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 18, 17, 'Commande #657bfa66', NULL, '2025-11-26 01:47:05'),
('4f267456-c5cf-4787-a271-da2237990dfc', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 25, 24, 'Commande #488131ce', NULL, '2025-11-26 01:13:01'),
('5048eb3f-64f1-415a-86bb-76b8d38e556b', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 8, 7, 'Commande #ef660626', NULL, '2025-11-26 01:54:55'),
('552e7b74-cb01-4ee1-8063-7523e46cd4b1', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 0, 0, 'Commande #0fabce2c', NULL, '2025-11-26 14:38:51'),
('5627b3ea-1cdc-4f6d-9187-3b67a324a9f5', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 1, 0, 'Commande #7c60aa52', NULL, '2025-11-26 14:38:13'),
('5b4b5cef-13cf-4e06-ab4e-12f8371ed286', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 6, 5, 'Commande #d469f115', NULL, '2025-11-26 02:15:50'),
('5d512f3d-dec1-479d-bf00-5bd73a2dc2c3', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 10, 9, 'Commande #3adb24e0', NULL, '2025-11-26 02:12:27'),
('610eddc0-a358-4ef8-b976-0ed675126d14', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #dd09eba2', NULL, '2025-11-26 14:16:01'),
('617e541a-7878-4190-9399-d74b0f817ba7', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 8, 7, 'Commande #a920d568', NULL, '2025-11-26 14:05:49'),
('675e030f-33e9-4bf6-8678-0e64e2fc8156', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #e9673b57', NULL, '2025-11-26 14:14:48'),
('6804af37-a533-4ade-9d18-6635d513a902', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 19, 18, 'Commande #73df9f18', NULL, '2025-11-26 01:39:47'),
('692c85aa-753a-4aa1-8311-abbde4935e90', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 4, 3, 'Commande #50c6e52c', NULL, '2025-11-26 02:18:32'),
('6959ac5f-d9a2-4f9d-870e-7c9bc222bcc6', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 3, 2, 'Commande #0732561c', NULL, '2025-11-26 14:01:19'),
('70c7eba1-de87-42e1-b4f7-993876abadbc', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 24, 23, 'Commande #34f5adfe', NULL, '2025-11-26 01:13:11'),
('71714892-ef1a-4136-a407-0628c2f68636', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'adjustment', 2, 100, 102, 'augmentation', 'f01ffc62-f214-47ea-abcd-d7641db2a797', '2025-11-20 14:22:42'),
('78738614-041c-4309-bbc3-ec745f3c4de5', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 15, 14, 'Commande #e321317d', NULL, '2025-11-26 01:24:21'),
('7b651bab-1fb8-4e18-80c2-645f96dbbd39', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 5, 4, 'Commande #e9673b57', NULL, '2025-11-26 14:14:45'),
('7de9b30b-5ce9-4166-8357-8cf4fb9f14ad', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 10, 9, 'Commande #784c1abc', NULL, '2025-11-26 14:02:50'),
('7f84c24d-a496-45a7-b7ea-a570f092d5a2', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'in', 10, 0, 10, ' ', 'f01ffc62-f214-47ea-abcd-d7641db2a797', '2025-12-09 16:03:28'),
('80b593ab-b79c-410c-ac18-04beb55e79a8', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'out', 2, 102, 100, 'vente', 'f01ffc62-f214-47ea-abcd-d7641db2a797', '2025-11-22 01:16:22'),
('8337a866-0795-4f76-be64-92da5840b3a2', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 1, 0, 'Commande #a920d568', NULL, '2025-11-26 14:05:51'),
('92513c08-b946-4355-9f5a-b34bc0486fb8', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 0, 0, 'Commande #ee353003', NULL, '2025-11-26 14:00:41'),
('996cdfb0-5f7f-4c83-b202-17f3e8f3125a', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 11, 10, 'Commande #a6d9027d', NULL, '2025-11-26 02:10:21'),
('9a30c756-9d1e-49e2-a9f9-2fc0a7547173', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 9, 8, 'Commande #657bfa66', NULL, '2025-11-26 01:47:07'),
('a3fdb587-7833-411b-acab-bee57e1fdc8f', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 0, 0, 'Commande #0610020a', NULL, '2025-11-26 14:42:00'),
('a4384690-37c7-4055-9317-63b1c90a653d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 2, 1, 'Commande #f7698715', NULL, '2025-11-26 02:26:20'),
('a7babc8f-90f8-45df-8fb6-9ec3323913d9', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 15, 14, 'Commande #26867981', NULL, '2025-11-26 02:03:59'),
('aeb56c02-c25f-4e5b-b0e5-f183bbfa9682', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 6, 5, 'Commande #bd94202e', NULL, '2025-11-26 13:59:40'),
('af72dd42-0415-484f-a6a6-a453c666a19d', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 23, 22, 'Commande #7e91df9f', NULL, '2025-11-26 01:19:26'),
('b087710c-76c9-4fbc-b165-6f97bac72248', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 22, 21, 'Commande #18d6b182', NULL, '2025-11-26 01:25:35'),
('b83b1068-9b67-4e67-8877-936acc663029', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 9, 8, 'Commande #e17ac8df', NULL, '2025-11-26 02:12:58'),
('bd516c22-2834-43b2-a672-5d413f558565', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 7, 6, 'Commande #f67d7f60', NULL, '2025-11-26 02:14:44'),
('bf4d4ecd-b770-4354-9dc5-c33466052dfb', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 17, 16, 'Commande #ef660626', NULL, '2025-11-26 01:54:57'),
('c182e711-34cd-4cbd-ba0d-df6b8eefd18e', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #72ac3968', NULL, '2025-11-26 14:23:46'),
('c7a2ab6f-5b97-446b-aa10-8632822dc8f6', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 12, 11, 'Commande #712c48a2', NULL, '2025-11-26 01:36:30'),
('cc7fda7b-2554-407c-a6a7-381920c31f9a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #77b8e10b', NULL, '2025-11-26 14:08:39'),
('ce5fc179-3279-497e-aec0-0586919fd246', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #17ae1b82', NULL, '2025-11-26 14:34:56'),
('d1cf8cc4-b820-4284-830f-6b52b9f48efe', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 14, 13, 'Commande #00f40ba4', NULL, '2025-11-26 02:04:36'),
('d7ad3ad1-f646-45bf-82b1-688f52bf2c41', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 13, 12, 'Commande #49ddc1a0', NULL, '2025-11-26 02:08:23'),
('dd2e44f4-0683-41e1-81c2-3cb346f77366', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #17543724', NULL, '2025-11-26 14:09:43'),
('e17b324d-02ee-4179-8161-f51278e2882b', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 3, 2, 'Commande #bf91096e', NULL, '2025-11-26 02:25:57'),
('e66edfbb-6170-4085-af01-66b28403b969', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 13, 12, 'Commande #bb6b9665', NULL, '2025-11-26 01:33:15'),
('e94a9d0f-34fe-4bee-b176-3b92cb191082', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 0, 0, 'Commande #0fabce2c', NULL, '2025-11-26 14:38:54'),
('ea750174-63c1-406d-95d0-3b866aa6a622', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 6, 5, 'Commande #17543724', NULL, '2025-11-26 14:09:38'),
('eb814847-0eb2-405f-906e-214fea09b8a7', 'cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'out', 2, 100, 98, 'vente', 'f01ffc62-f214-47ea-abcd-d7641db2a797', '2025-11-22 01:16:42'),
('f32b526a-171b-42b2-871d-ef3eb8a68a27', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 2, 1, 'Commande #e7171cfd', NULL, '2025-11-26 14:01:56'),
('f71624a1-0f8b-4e4d-b1ea-d96af39825fc', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 4, 3, 'Commande #ee353003', NULL, '2025-11-26 14:00:40'),
('f8762a6b-d726-4a3b-9685-1b1ba50ac1f0', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'out', 1, 12, 11, 'Commande #ec900b6e', NULL, '2025-11-26 02:09:11'),
('fbbf3a29-553f-42c1-b253-5fd45d62a7c5', '98187c91-31fa-48c7-88ec-f3f36ba929bc', 'out', 1, 2, 1, 'Commande #17ae1b82', NULL, '2025-11-26 14:34:54'),
('fbcc0daa-53d5-45d2-8c47-8222dcbc750a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'out', 1, 11, 10, 'Commande #73df9f18', NULL, '2025-11-26 01:39:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `loyalty_points` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `code` varchar(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `is_active`, `loyalty_points`, `created_at`, `phone`, `address`, `reset_token`, `reset_token_expiry`, `code`) VALUES
('1de64cf6-7a48-4bd5-85eb-e8137620ff64', 'dakar200901@gmail.com', 'scrypt:32768:8:1$CAINZ4SbXByyqUMd$fc6684dff11ddb20f608d7d7987a820f7f35a4c84612e126ca40e034d8be2e0cb3c29af515045b7e480c09eb4445ca9897319f591d26fd00eb8aece93619c8cb', 'Talla Ndiaye', 'admin', 1, 0, '2025-11-21 18:45:07', '+221773336666', 'Cité Hamo 3', NULL, NULL, 'D71AEFAD'),
('8d82b8a4-8515-4f49-8d5d-592224c33dbd', 'moneduc1234@gmail.com', '$2b$12$1dE8KEVcqt0uWSF0V8VLFe1cuE7SGrdO8ybom5SA3/fKGvMxWBpYu', 'Mouusa Camara', 'user', 1, 0, '2025-11-24 13:11:27', '+221776306632', NULL, NULL, NULL, '753QJH4T'),
('971febd2-5321-4b50-8007-5da706f81218', 'ndiayetalla928@gmail.com', '$2b$12$nLlX/8nF0QuQMhbRqmanTeQW5PBPdzDi3Rv2izyg12RMgxaBYTQPa', 'Talla Ndiaye', 'user', 1, 0, '2025-11-15 18:34:41', '+221784448928', NULL, NULL, NULL, '3CDDDAE1'),
('a62aa9e3-706f-465e-80b8-9690324d8140', 'diourbel200901@gmail.com', '$2b$12$5xaQRrIRclZTRyZQm986heibRAw87ugf59sXcc02IReN7mHiJClzm', 'Talla Ndiaye', 'user', 1, 7300, '2025-11-12 16:09:23', '+221772678207', 'Cité Hamo 3', NULL, NULL, '66F9292A'),
('f01ffc62-f214-47ea-abcd-d7641db2a797', 'admin@exemple.com', '$2b$12$jFSL7QfnP/KatZTh0YH.8es2feN6Y06Qg4OhoRWK0fIJ5YdEnLUKy', 'Admin User', 'admin', 1, 1000, '2025-11-12 12:41:38', '784448928', 'Cité Hamo 3', NULL, NULL, '5258435B'),
('fc69b893-efe4-41b5-b647-d4015a7a1ab8', 'moussa@gmail.com', '$2b$12$AR7//CyX4Kyou6hl0r0zSeQqaflR99ZeLY6TeFeWoh4ExlrlJ6puy', 'moussa falla', 'user', 1, 0, '2025-11-15 15:54:40', '+221771234567', 'sdfghjk', NULL, NULL, '18BD887D');

-- --------------------------------------------------------

--
-- Table structure for table `user_visits`
--

CREATE TABLE `user_visits` (
  `id` int(11) NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `visit_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_visits`
--

INSERT INTO `user_visits` (`id`, `user_id`, `visit_date`, `phone`) VALUES
(8, '8d82b8a4-8515-4f49-8d5d-592224c33dbd', '2025-11-24 12:21:39', '+221776306632'),
(9, 'a62aa9e3-706f-465e-80b8-9690324d8140', '2025-11-24 14:19:48', '+221772678207');

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT 0.00,
  `max_uses` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `valid_from` timestamp NOT NULL,
  `valid_until` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vouchers`
--

INSERT INTO `vouchers` (`id`, `code`, `type`, `value`, `min_order_amount`, `max_uses`, `used_count`, `valid_from`, `valid_until`, `is_active`, `created_at`) VALUES
('1b49ba07-d6f9-4bc7-b82c-207ca29c72a3', 'OTF6HAY6', 'fixed', 5000.00, 0.00, 1, 0, '2025-11-18 00:44:40', '2025-12-18 00:44:40', 1, '2025-11-18 01:44:41'),
('3adf3660-5d12-41cb-bc0e-99a022b9c2b3', 'MATH101', 'percentage', 10.00, 1000.00, 1, 1, '2025-11-14 15:44:00', '2025-11-15 15:44:00', 1, '2025-11-14 16:47:48'),
('526e9d7e-e5d7-440f-baa1-c6520df07257', 'MATH', 'fixed', 1500.00, 10000.00, 2, 2, '2025-11-14 15:39:00', '2025-11-15 15:39:00', 1, '2025-11-14 16:39:26'),
('e6cf4ff1-6480-49ce-9719-e815ecffcb03', 'T7EDA1B8', 'fixed', 50000.00, 0.00, 1, 0, '2025-11-19 21:28:39', '2025-12-19 21:28:39', 1, '2025-11-19 22:28:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_order` (`display_order`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Indexes for table `flash_sales`
--
ALTER TABLE `flash_sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_active_time` (`is_active`,`end_time`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_invoice_number` (`invoice_number`),
  ADD KEY `idx_customer_email` (`customer_email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_order` (`order_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_password_resets_user_id` (`user_id`),
  ADD KEY `idx_password_resets_token` (`token`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order` (`order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_featured` (`is_featured`),
  ADD KEY `idx_price` (`price`);
ALTER TABLE `products` ADD FULLTEXT KEY `idx_search` (`name`,`description`,`brand`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `stock_movements_ibfk_2` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `idx_code` (`code`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_users_reset_token` (`reset_token`);

--
-- Indexes for table `user_visits`
--
ALTER TABLE `user_visits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`user_id`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_active_dates` (`is_active`,`valid_from`,`valid_until`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user_visits`
--
ALTER TABLE `user_visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `banners`
--
ALTER TABLE `banners`
  ADD CONSTRAINT `banners_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `flash_sales`
--
ALTER TABLE `flash_sales`
  ADD CONSTRAINT `flash_sales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_visits`
--
ALTER TABLE `user_visits`
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
