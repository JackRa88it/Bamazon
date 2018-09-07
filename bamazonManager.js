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
  connection.query("SELECT products.id AS ID, products.name AS Product, departments.name AS Department, products.price AS Price, products.stock_qty AS 'In Stock' FROM products LEFT JOIN departments ON products.id_departments = departments.id ORDER BY products.id", function(err, res) {
    console.table('Products for sale', res);
    managerPrompt();
  });
};

function viewLowInventory() {
  connection.query("SELECT products.id AS ID, products.name AS Product, departments.name AS Department, products.price AS Price, products.stock_qty AS 'In Stock' FROM products LEFT JOIN departments ON products.id_departments = departments.id WHERE products.stock_qty <= 5 ORDER BY products.id", function(err, res) {
    console.table('Low inventory', res);
    managerPrompt();
  });
};

function addInventory() {
  connection.query("SELECT products.id AS ID, products.name AS Product, departments.name AS Department, products.price AS Price, products.stock_qty AS 'In Stock' FROM products LEFT JOIN departments ON products.id_departments = departments.id ORDER BY products.id", function(err, res) {
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
        if (response.id == res[i].ID){
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
        managerPrompt();
      };
    });
  });
};

function transaction(type, queryRecord, qty) {
  // start with SO transaction type, then maybe PO, RMA, etc.
  orderQty = parseInt(qty);
  console.table(
    'Please review your ' + type + ':', 
    [
      {
        Item: queryRecord.Product,
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
      connection.query("SELECT * FROM products WHERE ?", [{id: queryRecord.ID}], function(err, res) {
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
              id: res[0].id
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

// BROKEN CURRENTLY (setting department by name)
// make them add id_departments by using a list of dept names
function addNewProduct() {
  connection.query("SELECT * FROM departments", function(err, res) {
    var deptList = [];
    var deptID;
    for (i = 0; i < res.length; i++) {
      deptList.push(res[i].name);
    };
    inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Please enter a product name'
      },
      {
        name: 'dept',
        // make this a list based on the departments table
        // store matching department id as var deptID
        type: 'list',
        choices: deptList,
        message: 'Please enter a department name'
      },
      {
        name: 'price',
        type: 'input',
        message: 'Please enter a unit price'
      }
    ]).then(function(response) {
      // take the dept name they chose and find the matching id
      for (i = 0; i < res.length; i++) {
        if (response.dept === res[i].name) {
          deptID = res[i].id;
        };
      };
      connection.query("INSERT INTO products SET ?",
        {
          name: response.name,
          id_departments: deptID,
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
// make dbase schema require unique department/product names