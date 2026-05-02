-- POS System Migration
-- Run once against the phone_shop database

-- 1. Add cashier role to users
ALTER TABLE users
  MODIFY role ENUM('user', 'admin', 'cashier') DEFAULT 'user';

-- 2. PIN columns for POS login
ALTER TABLE users ADD COLUMN IF NOT EXISTS pos_pin_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pos_pin_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pos_pin_locked_until TIMESTAMP NULL;

-- 3. Barcode on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE NULL;
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_barcode (barcode);

-- 4. POS Sessions (shifts)
CREATE TABLE IF NOT EXISTS pos_sessions (
  id VARCHAR(36) PRIMARY KEY,
  cashier_id VARCHAR(36) NOT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  closing_balance DECIMAL(12,2) NULL,
  cash_difference DECIMAL(12,2) NULL,
  status ENUM('open','closed') DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_cashier_session (cashier_id),
  INDEX idx_session_status (status)
);

-- 5. POS Transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id VARCHAR(36) PRIMARY KEY,
  transaction_number VARCHAR(30) UNIQUE NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(20) NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash','wave','orange_money','mixed') NOT NULL,
  cash_tendered DECIMAL(12,2) DEFAULT 0,
  mobile_tendered DECIMAL(12,2) DEFAULT 0,
  mobile_reference VARCHAR(100) NULL,
  change_given DECIMAL(12,2) DEFAULT 0,
  status ENUM('completed','refunded','partially_refunded','voided') DEFAULT 'completed',
  synced BOOLEAN DEFAULT TRUE,
  client_created_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pos_sessions(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_session_txn (session_id),
  INDEX idx_cashier_txn (cashier_id),
  INDEX idx_txn_number (transaction_number)
);

-- 6. POS Transaction Items
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL,
  product_barcode VARCHAR(100) NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  discount DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id),
  INDEX idx_txn_items (transaction_id)
);

-- 7. POS Returns
CREATE TABLE IF NOT EXISTS pos_returns (
  id VARCHAR(36) PRIMARY KEY,
  return_number VARCHAR(30) UNIQUE NOT NULL,
  original_transaction_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  refund_method ENUM('cash','wave','orange_money') NOT NULL,
  total_refunded DECIMAL(12,2) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (original_transaction_id) REFERENCES pos_transactions(id),
  INDEX idx_original_txn (original_transaction_id)
);

-- 8. POS Return Items
CREATE TABLE IF NOT EXISTS pos_return_items (
  id VARCHAR(36) PRIMARY KEY,
  return_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity_returned INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (return_id) REFERENCES pos_returns(id)
);

-- 9. POS Cash Movements (manual in/out)
CREATE TABLE IF NOT EXISTS pos_cash_movements (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  type ENUM('in','out') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pos_sessions(id),
  INDEX idx_session_movements (session_id)
);
