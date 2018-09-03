DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;

CREATE TABLE products (
  item_id INT(10) AUTO_INCREMENT NOT NULL,
  product_name VARCHAR(30) NULL,
  dept_name VARCHAR(30) NULL,
  price INT(10) NULL,
  stock_qty INT(10) NULL,
  PRIMARY KEY (item_id)
);