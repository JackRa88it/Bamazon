DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;

CREATE TABLE products (
  id INT(10) AUTO_INCREMENT NOT NULL,
  name VARCHAR(30) NULL,
  id_departments INT(10) NULL,
  price INT(10) NULL,
  stock_qty INT(10) NULL,
  sales INT(10) NULL,
  PRIMARY KEY (id)
);

CREATE TABLE departments (
  id INT(10) AUTO_INCREMENT NOT NULL,
  name VARCHAR(30) NULL,
  overhead INT(10) NULL,
  PRIMARY KEY (id)
);