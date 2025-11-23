-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: mysql-teuss.alwaysdata.net    Database: teuss_phone_shop
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order` (`display_order`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `banners_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES ('7f1e86b5-097a-430d-9408-d7bca7eac567','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','Nouveau testeeeee','15% de reduction',5,1,'2025-11-12 14:10:22'),('cfaa229d-b8c1-48db-a1ea-12e136537e8f','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','AirPods Pro 2','Offre spéciale',2,1,'2025-11-12 12:41:44');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES ('9601c058-53dd-40c5-a9aa-15c329fc8de7','f01ffc62-f214-47ea-abcd-d7641db2a797','b2b4653c-0ef1-463f-a53e-d6c97a5575b6',1,'2025-11-12 15:03:56','2025-11-12 15:03:56');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `product_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('677faca7-ef00-4730-a9f0-3b8261127732','Smartphones','smartphones','Smartphone',0),('6ebfccd6-931d-42b0-bc87-790039e3946f','Accessoires','accessories','Headphones',0),('c3642266-26a0-4b7e-b1d4-d882c5375068','Tablettes','tablets','Tablet',0),('ef2de43c-eb3e-4de4-81a7-e483622f7e84','Montres connectées','smartwatches','Watch',0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flash_sales`
--

DROP TABLE IF EXISTS `flash_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flash_sales` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `original_price` decimal(10,2) NOT NULL,
  `sale_price` decimal(10,2) NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `stock_limit` int(11) DEFAULT NULL,
  `sold_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_active_time` (`is_active`,`end_time`),
  CONSTRAINT `flash_sales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flash_sales`
--

LOCK TABLES `flash_sales` WRITE;
/*!40000 ALTER TABLE `flash_sales` DISABLE KEYS */;
INSERT INTO `flash_sales` VALUES ('5e535efb-f2f2-4d05-85fc-8360249799dc','b2b4653c-0ef1-463f-a53e-d6c97a5575b6',10000.00,1000.00,'2025-11-12 13:43:00','2025-11-30 13:43:00',1,0,1);
/*!40000 ALTER TABLE `flash_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice_items` (
  `id` varchar(36) NOT NULL COMMENT 'UUID unique de l''article',
  `invoice_id` varchar(36) NOT NULL COMMENT 'ID de la facture parente',
  `product_id` varchar(36) DEFAULT NULL COMMENT 'ID du produit (optionnel pour articles manuels)',
  `product_name` varchar(255) NOT NULL COMMENT 'Nom de l''article',
  `product_image` varchar(500) DEFAULT NULL COMMENT 'URL de l''image du produit',
  `unit_price` decimal(10,2) NOT NULL COMMENT 'Prix unitaire HT',
  `quantity` int(11) NOT NULL COMMENT 'Quantité commandée',
  `total` decimal(10,2) NOT NULL COMMENT 'Total ligne (prix unitaire × quantité)',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Date d''ajout de l''article',
  PRIMARY KEY (`id`),
  KEY `idx_invoice_id` (`invoice_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des articles de factures';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES ('0744f235-ff69-4e63-922a-6402ecb8a7f1','820257b8-960e-419c-b02a-60a160c43ec1',NULL,'Samsung Galaxy S24 Ultra','https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',1099.99,1,1099.99,'2025-11-21 08:59:33'),('1598842b-b6e9-494e-a27d-407b6e6b28af','b9b45ea0-23ae-49a4-831a-3ad9478313ad',NULL,'Talla Ndiaye',NULL,10.00,100,1000.00,'2025-11-13 16:15:21'),('3464b3cf-265f-4c1a-bbb0-534851350310','820257b8-960e-419c-b02a-60a160c43ec1','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',10000.00,1,10000.00,'2025-11-21 08:59:33'),('3b2ebd6f-afcf-424d-99a2-ab73cf938407','82949eb3-9f34-4b17-b6af-2ce4dfa9edd8',NULL,'moussa',NULL,1000.00,100,100000.00,'2025-11-14 23:03:21'),('51bda355-caf0-4f09-b80f-66bd7a069b0f','38228a01-8aed-43ea-b2bf-db579bfd488c','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','AirPods Pro 2','https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7',249.99,1,249.99,'2025-11-21 08:53:07'),('6b37e7d5-8134-4d93-95b1-03065b2edaf8','820257b8-960e-419c-b02a-60a160c43ec1','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','AirPods Pro 2','https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7',249.99,1,249.99,'2025-11-21 08:59:33'),('84e82c9a-1b64-4b8d-9a0a-1759cd7256a8','70f4098e-9a3b-405e-92dc-980147d2df2b',NULL,'iPhone 11',NULL,1000.00,10,10000.00,'2025-11-14 05:30:22'),('9179b3d8-625e-4bf3-8fcf-b37b41a1e7e0','38228a01-8aed-43ea-b2bf-db579bfd488c','8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0','iPad Air','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',599.99,1,599.99,'2025-11-21 08:53:07'),('b188248e-18f3-4e9e-9021-f79193d40569','368bc7df-aa5d-4a2b-ae2c-0fa0964fb859','8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0','iPad Air','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',599.99,3,1799.97,'2025-11-21 08:28:52'),('de03914f-227a-4173-ae6a-aace5d87db1e','086654ce-6e26-420d-8a42-ee6779d9eb69','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','AirPods Pro 2','https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7',249.99,12,2999.88,'2025-11-20 17:09:09');
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Date de dernière modification',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_customer_email` (`customer_email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des factures';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('086654ce-6e26-420d-8a42-ee6779d9eb69','INV-202511-0304',NULL,NULL,'aa','ff','+221784448928','Cité Hamo 3','Dakar',2999.88,0.00,0.00,1000.00,1999.88,'paid','card','2025-11-20 16:09:08','qsdfghjklm',NULL,'2025-11-20 17:09:09','2025-11-20 17:09:09'),('368bc7df-aa5d-4a2b-ae2c-0fa0964fb859','INV-519859AE',NULL,NULL,'Talla Ndiaye','ndiayetalla928@gmail.com','+221784448928','Cité Hamo 3','Dakar',1799.97,0.00,0.00,0.00,1799.97,'paid','cash_on_delivery','2025-11-21 07:28:51',NULL,NULL,'2025-11-21 08:28:52','2025-11-21 08:28:52'),('38228a01-8aed-43ea-b2bf-db579bfd488c','INV-301A51FD',NULL,NULL,'Talla Ndiaye','ndiayetalla928@gmail.com','+221784448928','Cité Hamo 3','Dakar',849.98,0.00,0.00,0.00,849.98,'pending','cash_on_delivery',NULL,NULL,NULL,'2025-11-21 08:53:07','2025-11-21 08:53:07'),('70f4098e-9a3b-405e-92dc-980147d2df2b','INV-1CA9282E',NULL,NULL,'Moussa Diop ','diourbel200901@gmail.com','78282882&2&2','Feusbjsbeshsbe','Dajmsms',10000.00,2000.00,20.00,0.00,12000.00,'paid','cash_on_delivery','2025-11-14 05:30:22','Ha shshshsnsns ',NULL,'2025-11-14 05:30:22','2025-11-14 05:30:22'),('820257b8-960e-419c-b02a-60a160c43ec1','INV-4599C543',NULL,NULL,'Talla Ndiaye','ndiayetalla928@gmail.com','+221784448928','Cité Hamo 3','Dakar',11349.98,0.00,0.00,0.00,11349.98,'paid','','2025-11-21 07:59:33',NULL,NULL,'2025-11-21 08:59:33','2025-11-21 08:59:33'),('82949eb3-9f34-4b17-b6af-2ce4dfa9edd8','INV-DFEABD78',NULL,NULL,'Talla Ndiaye','ndiayetalla928@gmail.com','784448928','Cité Hamo 3','Dakar',100000.00,20000.00,20.00,0.00,120000.00,'pending','other',NULL,NULL,NULL,'2025-11-14 23:03:21','2025-11-14 23:03:21'),('b9b45ea0-23ae-49a4-831a-3ad9478313ad','INV-854C31D2',NULL,NULL,'Talla Ndiaye','ndiayetalla928@gmail.com','784448928','Cité Hamo 3','Dakar',1000.00,200.00,20.00,0.00,1200.00,'paid','other','2025-11-13 15:15:19','teste',NULL,'2025-11-13 16:15:21','2025-11-13 16:15:21');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` text DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES ('05d18e53-1875-443a-8eed-d1d5f2a805a1','c78e6bd2-5b67-467b-9680-11989d776c0a','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','imphone d talla','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',1,10000.00),('114c7c47-dcc6-4de0-ba20-abfef199dbef','69629cf8-3053-44aa-89a1-dfb6c6bd8107','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',1,10000.00),('4a0b2b4a-ea84-4599-bd2f-52095ee0bbe3','2435d95d-56d6-4e75-bc0a-db70fc1dad40','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',1,10000.00),('59894692-c5a2-4c79-80de-4230489a1f3e','5231e596-7329-49a6-b067-cfd421740ca5','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',2,10000.00),('b0166492-2034-437e-b226-94ed092a74fc','2435d95d-56d6-4e75-bc0a-db70fc1dad40',NULL,'Samsung Galaxy S24 Ultra','https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',3,1099.99),('b7d18712-8a71-4db8-bbd5-81102901b1e5','a57d7719-3d35-41ab-8a0c-f6901fb22e20',NULL,'Samsung Galaxy S24 Ultra','https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',5,1099.99),('dd9e253a-ae61-4600-85b8-b3331fd1596d','2435d95d-56d6-4e75-bc0a-db70fc1dad40',NULL,'iPhone 15 Pro Max','https://images.unsplash.com/photo-1696446702061-cbd8e7e14c9e',3,1199.99),('f4b5bd0a-0b9e-4e70-9371-c00dc7e187ea','a57d7719-3d35-41ab-8a0c-f6901fb22e20','b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR',1,10000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('2435d95d-56d6-4e75-bc0a-db70fc1dad40','a62aa9e3-706f-465e-80b8-9690324d8140','pending',16899.94,0.00,16899.94,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}',NULL,NULL,3,0.00,'2025-11-21 17:54:06','2025-11-21 17:54:06'),('5231e596-7329-49a6-b067-cfd421740ca5','a62aa9e3-706f-465e-80b8-9690324d8140','pending',20000.00,1500.00,18500.00,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Dakar\", \"city\": \"Dakar\"}',NULL,'MATH',1850,0.00,'2025-11-14 18:01:33','2025-11-14 18:01:33'),('69629cf8-3053-44aa-89a1-dfb6c6bd8107','a62aa9e3-706f-465e-80b8-9690324d8140','pending',10000.00,0.00,10000.00,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}',NULL,NULL,1000,0.00,'2025-11-21 17:50:42','2025-11-21 17:50:42'),('6eaf79bc-a627-44c2-941e-c6ca88e0ac1d','a62aa9e3-706f-465e-80b8-9690324d8140','pending',16999.60,1500.00,15499.60,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}',NULL,'MATH',0,0.00,'2025-11-14 17:44:15','2025-11-14 17:44:15'),('a57d7719-3d35-41ab-8a0c-f6901fb22e20','a62aa9e3-706f-465e-80b8-9690324d8140','pending',15499.95,0.00,15499.95,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221772678207\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}',NULL,NULL,3,0.00,'2025-11-21 17:59:50','2025-11-21 17:59:50'),('c78e6bd2-5b67-467b-9680-11989d776c0a','a62aa9e3-706f-465e-80b8-9690324d8140','pending',10000.00,1000.00,9000.00,'{\"name\": \"Talla Ndiaye\", \"phone\": \"+221784448928\", \"address\": \"Cit\\u00e9 Hamo 3\", \"city\": \"Dakar\"}',NULL,'WELCOME10',900,0.00,'2025-11-14 15:29:40','2025-11-14 15:29:40');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_password_resets_user_id` (`user_id`),
  KEY `idx_password_resets_token` (`token`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES ('4a30c217-c4d7-11f0-9a39-525400354254','a62aa9e3-706f-465e-80b8-9690324d8140','fwuOdm87zDeRpXvCfdOXyC6pn_g4CIoo4AHW2iaWfrzulJep-ORyA3g9hE0WwPTR','2025-11-19 00:35:38',0,'2025-11-19 00:35:39'),('74da9967-c48c-11f0-9a39-525400354254','a62aa9e3-706f-465e-80b8-9690324d8140','g3Xrd2FESW8YtZkO8ulpC-HBXtz-4KB2cqr7k9ebw_zfeq2GsekNt0mFioASH1uW','2025-11-18 15:39:57',0,'2025-11-18 15:39:58'),('a91ae56e-c4d5-11f0-9a39-525400354254','a62aa9e3-706f-465e-80b8-9690324d8140','sUBiYnrybNQ3zeRMU3OU_4eD77EqVR_mjiUHVfmoIoJqaRRcrx8ghYaBICaQje7G','2025-11-19 00:23:58',1,'2025-11-19 00:23:59');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_price` (`price`),
  FULLTEXT KEY `idx_search` (`name`,`description`,`brand`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('8f1db1bf-f8b5-4a2a-a7da-16d81b4a82c0','iPad Air','Tablette puissante avec puce M1',599.99,NULL,'c3642266-26a0-4b7e-b1d4-d882c5375068','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0','[\"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0\"]',25,4.7,0,'Apple','{\"brand\": \"Apple\"}',1,'2025-11-12 12:41:43','2025-11-12 12:41:43'),('98187c91-31fa-48c7-88ec-f3f36ba929bc','Talla Ndiaye','aaaaaaaaaaaaaaa',400.00,NULL,'6ebfccd6-931d-42b0-bc87-790039e3946f','ssssssssssa','[\"ssssssssssa\", \"ssssssssssaa\", \"sssssssssaaa\"]',10,0.0,0,'zsedrfgth','{}',0,'2025-11-22 20:05:43','2025-11-22 20:05:43'),('b2b4653c-0ef1-463f-a53e-d6c97a5575b6','iPhone 16','teste',10000.00,10000.00,'6ebfccd6-931d-42b0-bc87-790039e3946f','https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR','[\"https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17pro-digitalmat-gallery-1-202509_GEO_XF?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=ekJPc2lPUlRuRk50SkcyOVdnU1d0TjFla0N0Znl3UThxdjB3SW91ZDVJejE2eWc0dEozdlZYM1RVYW9OTkdCVWQ5S3Q4dnBGQmd2K0NENXJLTFNwNzhmSGN3NTUxbDRHZDZXK1V3b1o4a1JSN0F2d2Z5elJrWEpxdXYvbW01dXVpU3kyL0FKUlpaZ25KNUNrQi8rOWdR\"]',15,0.0,0,'Apple','{}',0,'2025-11-12 13:50:52','2025-11-14 04:26:19'),('cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','AirPods Pro 2','Écouteurs sans fil avec réduction de bruit',249.99,NULL,'6ebfccd6-931d-42b0-bc87-790039e3946f','https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7','[\"https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7\"]',98,4.6,0,'Apple','{\"brand\": \"Apple\"}',1,'2025-11-12 12:41:43','2025-11-22 02:16:43');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_movements` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `movement_type` enum('in','out','return','adjustment') NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_created` (`created_at`),
  KEY `stock_movements_ibfk_2` (`user_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES ('71714892-ef1a-4136-a407-0628c2f68636','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','adjustment',2,100,102,'augmentation','f01ffc62-f214-47ea-abcd-d7641db2a797','2025-11-20 14:22:42'),('80b593ab-b79c-410c-ac18-04beb55e79a8','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','out',2,102,100,'vente','f01ffc62-f214-47ea-abcd-d7641db2a797','2025-11-22 01:16:22'),('eb814847-0eb2-405f-906e-214fea09b8a7','cfc19a6d-d287-4353-a2d2-bc1c5cf6a7f8','out',2,100,98,'vente','f01ffc62-f214-47ea-abcd-d7641db2a797','2025-11-22 01:16:42');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_visits`
--

DROP TABLE IF EXISTS `user_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_visits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `visit_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user` (`user_id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_visits`
--

LOCK TABLES `user_visits` WRITE;
/*!40000 ALTER TABLE `user_visits` DISABLE KEYS */;
INSERT INTO `user_visits` VALUES (1,'a62aa9e3-706f-465e-80b8-9690324d8140','2025-11-22 17:02:49',NULL),(2,'a62aa9e3-706f-465e-80b8-9690324d8140','2025-11-22 17:03:21',NULL),(3,'a62aa9e3-706f-465e-80b8-9690324d8140','2025-11-22 17:04:29',NULL),(4,'a62aa9e3-706f-465e-80b8-9690324d8140','2025-11-22 17:17:51','+221772678207'),(5,'a62aa9e3-706f-465e-80b8-9690324d8140','2025-11-22 17:18:49','+221772678207');
/*!40000 ALTER TABLE `user_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `code` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `idx_code` (`code`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('1de64cf6-7a48-4bd5-85eb-e8137620ff64','dakar200901@gmail.com','scrypt:32768:8:1$CAINZ4SbXByyqUMd$fc6684dff11ddb20f608d7d7987a820f7f35a4c84612e126ca40e034d8be2e0cb3c29af515045b7e480c09eb4445ca9897319f591d26fd00eb8aece93619c8cb','Talla Ndiaye','admin',1,0,'2025-11-21 18:45:07','+221773336666','Cité Hamo 3',NULL,NULL,'D71AEFAD'),('971febd2-5321-4b50-8007-5da706f81218','ndiayetalla928@gmail.com','$2b$12$nLlX/8nF0QuQMhbRqmanTeQW5PBPdzDi3Rv2izyg12RMgxaBYTQPa','Talla Ndiaye','user',1,0,'2025-11-15 18:34:41','+221784448928',NULL,NULL,NULL,'3CDDDAE1'),('a62aa9e3-706f-465e-80b8-9690324d8140','diourbel200901@gmail.com','$2b$12$5xaQRrIRclZTRyZQm986heibRAw87ugf59sXcc02IReN7mHiJClzm','Talla Ndiaye','user',1,7300,'2025-11-12 16:09:23','+221772678207','Cité Hamo 3',NULL,NULL,'66F9292A'),('f01ffc62-f214-47ea-abcd-d7641db2a797','admin@exemple.com','$2b$12$jFSL7QfnP/KatZTh0YH.8es2feN6Y06Qg4OhoRWK0fIJ5YdEnLUKy','Admin User','admin',1,1000,'2025-11-12 12:41:38','784448928','Cité Hamo 3',NULL,NULL,'5258435B'),('fc69b893-efe4-41b5-b647-d4015a7a1ab8','moussa@gmail.com','$2b$12$AR7//CyX4Kyou6hl0r0zSeQqaflR99ZeLY6TeFeWoh4ExlrlJ6puy','moussa falla','user',1,0,'2025-11-15 15:54:40','+221771234567','sdfghjk',NULL,NULL,'18BD887D');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active_dates` (`is_active`,`valid_from`,`valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES ('1b49ba07-d6f9-4bc7-b82c-207ca29c72a3','OTF6HAY6','fixed',5000.00,0.00,1,0,'2025-11-18 00:44:40','2025-12-18 00:44:40',1,'2025-11-18 01:44:41'),('3adf3660-5d12-41cb-bc0e-99a022b9c2b3','MATH101','percentage',10.00,1000.00,1,1,'2025-11-14 15:44:00','2025-11-15 15:44:00',1,'2025-11-14 16:47:48'),('526e9d7e-e5d7-440f-baa1-c6520df07257','MATH','fixed',1500.00,10000.00,2,2,'2025-11-14 15:39:00','2025-11-15 15:39:00',1,'2025-11-14 16:39:26'),('e6cf4ff1-6480-49ce-9719-e815ecffcb03','T7EDA1B8','fixed',50000.00,0.00,1,0,'2025-11-19 21:28:39','2025-12-19 21:28:39',1,'2025-11-19 22:28:40');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-23 14:06:45
