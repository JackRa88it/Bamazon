var mysql = require('mysql');
var inquirer = require('inquirer');
const cTable = require('console.table');

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  managerPrompt();
});

// connect and display table of items before prompting user input:
function managerPrompt() {
  inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      choices: ['View products for sale', 'View low inventory', 'Add to inventory', 'Add new product', 'Get me out of here'],
      message: 'What would you like to do?'
    }
  ]).then(function(response) {
    switch (response.action) {
      case 'View products for sale':
        viewProducts();
        break;
      case 'View low inventory':
        viewLowInventory();
        break;
      case 'Add to inventory':
        addInventory();
        break;
      case 'Add new product':
        addNewProduct();
        break;
      case 'Get me out of here':
        connection.end();
        break;
      default:
    };
  });
};

function viewProducts() {
  connection.query("SELECT * FROM products", function(err, res) {
    console.table('Products for sale', res);
    managerPrompt();
  });
};

function viewLowInventory() {
  connection.query("SELECT * FROM products WHERE stock_qty <= 5", function(err, res) {
    console.table('Low inventory', res);
    managerPrompt();
  });
};

function addInventory() {
  connection.query("SELECT * FROM products", function(err, res) {
    console.table('Inventory', res);
    if (err) throw err;
    inquirer.prompt([
      {
        name: 'id',
        type: 'input',
        message: 'Enter a product id:',
        // validate: function(input) {
        //   if (typeof input === 'number') {
        //     return true;
        //   };
        //   return false;
        // }
      }
    ]).then(function(response) {
      // check if id is a valid item
      var index = -1;
      for (var i = 0; i < res.length; i++) {
        if (response.id == res[i].item_id){
          index = i;
          break;
        };
      };
      if (index >= 0) {
        // now ask for qty
        inquirer.prompt([
          {
            name: 'qty',
            type: 'input',
            message: 'Enter the quantity to add:',
            // validate: function(input) {
            //   if (typeof input === 'number') {
            //     return true;
            //   };
            //   return false;
            // }
          }
        ]).then(function(response) {
            transaction('Stock Add', res[index], response.qty);
        });
      }
      else {
        console.log('Please enter a valid item ID');
        salesOrder();
      };
    });
  });
};

function transaction(type, productRecord, qty) {
  // start with SO transaction type, then maybe PO, RMA, etc.
  orderQty = parseInt(qty);
  console.table(
    'Please review your ' + type + ':', 
    [
      {
        Item: productRecord.product_name,
        Quantity: orderQty,
      }
    ]
  );
  inquirer.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      message:'Proceed with adding stock?'
    }
  ]).then(function(response) {
    if (response.confirm) {
      console.log('Adding to stock...');
      // get the absolute most current stock_qty and then proceed with order:
      connection.query("SELECT * FROM products WHERE ?", [{item_id: productRecord.item_id}], function(err, res) {
        // NOTE: ERROR CATCH HERE WITH IF STATEMENT ON AVAILABLE QTY
        // catch the stock qty and subtract the order qty
        var updatedQty = res[0].stock_qty + orderQty;
        connection.query(
          "UPDATE products SET ? WHERE ?",
          [
            {
              stock_qty: updatedQty
            },
            {
              item_id: res[0].item_id
            }
          ],
          function(err, res) {
            console.log('Stock successfully added.');
            transactionEnd();
          }
        );

      });
    }
    else {
      console.log('Ok, nevermind!');
      transactionEnd();
    };
  });
};

// provide a go back/quit option, which also lets users read their order confirmation before going back to customerPrompt() and dumping the whole table onto the console:
function transactionEnd() {
  inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      choices: ['Main menu', 'Get me out of here'],
      message: 'What would you like to do?'
    }
  ]).then(function(response) {
    switch (response.action) {
      case 'Main menu':
        managerPrompt();
        break;
      case 'Get me out of here':
        connection.end();
        break;
      default:
    };
  });
}

function addNewProduct() {
  connection.query("SELECT * FROM products", function(err, res) {
    inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Please enter a product name'
      },
      {
        name: 'dept',
        // make this a list based on the departments table
        type: 'input',
        message: 'Please enter a department name'
      },
      {
        name: 'price',
        type: 'input',
        message: 'Please enter a unit price'
      }
    ]).then(function(response) {
      connection.query("INSERT INTO products SET ?",
        {
          product_name: response.name,
          dept_name: response.dept,
          price: response.price
        },
        function(err, res) {
          console.log(res.affectedRows + " Product added!\n");
          transactionEnd();
        }
      );
    });
  });
};



// NOTES