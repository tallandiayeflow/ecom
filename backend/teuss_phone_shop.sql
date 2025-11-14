-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql-teuss.alwaysdata.net
-- Generation Time: Nov 14, 2025 at 11:56 PM
-- Server version: 10.11.14-MariaDB
-- PHP Version: 7.4.33

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
('237b93b3-c3d6-4518-87b1-40b814b8df4a', '2ae934a6-afe5-41ca-a64d-5c2ce35cb651', 'Samsung Galaxy S24 Ultra', 'Offre spéciale', 1, 1, '2025-11-12 12:41:44'),
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
('0a7fe4b6-98a8-4077-8ada-1bdcc61b9c8e', '090414b7-75f7-4813-8096-2420d42c0819', '8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 1, '2025-11-12 15:56:18', '2025-11-12 15:56:18'),
('1dba2eaa-d5d4-4d3c-b334-c44a60cd7789', '090414b7-75f7-4813-8096-2420d42c0819', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 1, '2025-11-12 15:56:16', '2025-11-12 15:56:16'),
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
('33344aa4-b004-47f0-86e5-9963f4713044', 'talla', 'iphone', NULL, 0),
('677faca7-ef00-4730-a9f0-3b8261127732', 'Smartphones', 'smartphones', 'Smartphone', 0),
('6ebfccd6-931d-42b0-bc87-790039e3946f', 'Accessoires', 'accessories', 'Headphones', 0),
('c3642266-26a0-4b7e-b1d4-d882c5375068', 'Tablettes', 'tablets', 'Tablet', 0),
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
('405a2ba5-7712-41ae-a0f3-d28490cc8e8a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 10000.00, 1000.00, '2025-11-12 13:43:00', '2025-11-13 13:43:00', 1, 0, 1),
('5d34690f-8dbc-4570-a9b2-ea32869fde64', '81351dcd-e6c6-4bb5-84a5-4a8e25bebbda', 1199.99, 959.99, '2025-11-12 11:41:43', '2025-11-19 11:41:43', 20, 0, 1),
('74f71e51-ec2a-41c1-b338-80fa0d968cf8', '2ae934a6-afe5-41ca-a64d-5c2ce35cb651', 1099.99, 879.99, '2025-11-12 11:41:43', '2025-11-19 11:41:43', 20, 0, 1),
('fa81ed25-164b-4af3-86bb-38a679c6883f', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 10000.00, 40.00, '2025-11-14 03:27:00', '2025-11-16 03:27:00', 10, 0, 1);

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
('70f4098e-9a3b-405e-92dc-980147d2df2b', 'INV-1CA9282E', NULL, NULL, 'Moussa Diop ', 'diourbel200901@gmail.com', '78282882&2&2', 'Feusbjsbeshsbe', 'Dajmsms', 10000.00, 2000.00, 20.00, 0.00, 12000.00, 'paid', 'cash_on_delivery', '2025-11-14 05:30:22', 'Ha shshshsnsns ', NULL, '2025-11-14 05:30:22', '2025-11-14 05:30:22'),
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
('1598842b-b6e9-494e-a27d-407b6e6b28af', 'b9b45ea0-23ae-49a4-831a-3ad9478313ad', NULL, 'Talla Ndiaye', NULL, 10.00, 100, 1000.00, '2025-11-13 16:15:21'),
('3b2ebd6f-afcf-424d-99a2-ab73cf938407', '82949eb3-9f34-4b17-b6af-2ce4dfa9edd8', NULL, 'moussa', NULL, 1000.00, 100, 100000.00, '2025-11-14 23:03:21'),
('84e82c9a-1b64-4b8d-9a0a-1759cd7256a8', '70f4098e-9a3b-405e-92dc-980147d2df2b', NULL, 'iPhone 11', NULL, 1000.00, 10, 10000.00, '2025-11-14 05:30:22');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `status`, `total`, `discount`, `final_total`, `shipping_address`, `payment_method`, `voucher_code`, `loyalty_points_earned`, `discount_amount`, `created_at`, `updated_at`) VALUES
('5231e596-7329-49a6-b067-cfd421740ca5', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 20000.00, 1500.00, 18500.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Dakar\", \"city\": \"Dakar\"}', NULL, 'MATH', 1850, 0.00, '2025-11-14 18:01:33', '2025-11-14 18:01:33'),
('6eaf79bc-a627-44c2-941e-c6ca88e0ac1d', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 16999.60, 1500.00, 15499.60, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, 'MATH', 0, 0.00, '2025-11-14 17:44:15', '2025-11-14 17:44:15'),
('c78e6bd2-5b67-467b-9680-11989d776c0a', 'a62aa9e3-706f-465e-80b8-9690324d8140', 'pending', 10000.00, 1000.00, 9000.00, '{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}', NULL, 'WELCOME10', 900, 0.00, '2025-11-14 15:29:40', '2025-11-14 15:29:40');

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
('05d18e53-1875-443a-8eed-d1d5f2a805a1', 'c78e6bd2-5b67-467b-9680-11989d776c0a', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'imphone d talla', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 1, 10000.00),
('59894692-c5a2-4c79-80de-4230489a1f3e', '5231e596-7329-49a6-b067-cfd421740ca5', 'b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', 2, 10000.00);

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
('2ae934a6-afe5-41ca-a64d-5c2ce35cb651', 'Samsung Galaxy S24 Ultra', 'Smartphone flagship avec S Pen', 1099.99, NULL, '677faca7-ef00-4730-a9f0-3b8261127732', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', '[\"https://images.unsplash.com/photo-1610945415295-d9bbf067e59c\"]', 35, 4.7, 0, 'Samsung', '{\"brand\": \"Samsung\"}', 1, '2025-11-12 12:41:42', '2025-11-12 12:41:42'),
('81351dcd-e6c6-4bb5-84a5-4a8e25bebbda', 'iPhone 15 Pro Max', 'Le dernier iPhone avec puce A17 Pro', 1199.99, NULL, '677faca7-ef00-4730-a9f0-3b8261127732', 'https://images.unsplash.com/photo-1696446702061-cbd8e7e14c9e', '[\"https://images.unsplash.com/photo-1696446702061-cbd8e7e14c9e\"]', 50, 4.8, 0, 'Apple', '{\"brand\": \"Apple\"}', 1, '2025-11-12 12:41:42', '2025-11-12 12:41:42'),
('8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0', 'iPad Air', 'Tablette puissante avec puce M1', 599.99, NULL, 'c3642266-26a0-4b7e-b1d4-d882c5375068', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', '[\"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0\"]', 25, 4.7, 0, 'Apple', '{\"brand\": \"Apple\"}', 1, '2025-11-12 12:41:43', '2025-11-12 12:41:43'),
('b2b4653c-0ef1-463f-a53e-d6c97a5575b6', 'iPhone 16', 'teste', 10000.00, 10000.00, '6ebfccd6-931d-42b0-bc87-790039e3946f', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR', '[\"https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR\"]', 15, 0.0, 0, 'Apple', '{}', 0, '2025-11-12 13:50:52', '2025-11-14 04:26:19'),
('cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8', 'AirPods Pro 2', 'Écouteurs sans fil avec réduction de bruit', 249.99, NULL, '6ebfccd6-931d-42b0-bc87-790039e3946f', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', '[\"https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7\"]', 100, 4.6, 0, 'Apple', '{\"brand\": \"Apple\"}', 1, '2025-11-12 12:41:43', '2025-11-12 12:41:43');

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
  `address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `is_active`, `loyalty_points`, `created_at`, `phone`, `address`) VALUES
('', 'Moneduc1234@gmail.com', '$2b$12$Q.fKvicO3NGX5kOBD/b9HebdnsksFKFAKmEZ6ppk7PQJS5NxPpz/e', 'moussa diop', 'user', 1, 0, '2025-11-12 22:01:05', '784448928', 'Cité Hamo 3'),
('090414b7-75f7-4813-8096-2420d42c0819', 'user@example.com', '$2b$12$SY9JKG3InkacH.z73XaGk.c2GoMJPWIVAH8/9H5P4moVqVDkF9Eyu', 'Test User', 'user', 1, 500, '2025-11-12 12:41:39', NULL, NULL),
('a62aa9e3-706f-465e-80b8-9690324d8140', 'diourbel200901@gmail.com', '$2b$12$jFSL7QfnP/KatZTh0YH.8es2feN6Y06Qg4OhoRWK0fIJ5YdEnLUKy', 'Talla Ndiaye', 'user', 1, 10294, '2025-11-12 16:09:23', '784448928', 'Cité Hamo 3'),
('f01ffc62-f214-47ea-abcd-d7641db2a797', 'admin@exemple.com', '$2b$12$jFSL7QfnP/KatZTh0YH.8es2feN6Y06Qg4OhoRWK0fIJ5YdEnLUKy', 'Admin User', 'admin', 1, 1000, '2025-11-12 12:41:38', '784448928', 'Cité Hamo 3');

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
('3adf3660-5d12-41cb-bc0e-99a022b9c2b3', 'MATH101', 'percentage', 10.00, 1000.00, 1, 0, '2025-11-14 15:44:00', '2025-11-15 15:44:00', 1, '2025-11-14 16:47:48'),
('526e9d7e-e5d7-440f-baa1-c6520df07257', 'MATH', 'fixed', 1500.00, 10000.00, 2, 2, '2025-11-14 15:39:00', '2025-11-15 15:39:00', 1, '2025-11-14 16:39:26');

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
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_featured` (`is_featured`),
  ADD KEY `idx_price` (`price`);
ALTER TABLE `products` ADD FULLTEXT KEY `idx_search` (`name`,`description`,`brand`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_active_dates` (`is_active`,`valid_from`,`valid_until`);

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
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
