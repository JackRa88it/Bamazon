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
  customerPrompt();
});

// connect and display table of items before prompting user input:
function customerPrompt() {
  connection.query("SELECT item_id AS ID, product_name AS Product, dept_name AS Department, price AS Price FROM products", function(err, queryRes) {
    if (err) throw err;
    console.table('Bamazon Catalog', queryRes);
    // prompt user:
    inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        choices: ['Buy product', 'Get me out of here'],
        message: 'What would you like to do?'
      }
    ]).then(function(response) {
      switch (response.action) {
        case 'Buy product':
          purchaseID();
          break;
        case 'Get me out of here':
          connection.end();
          break;
        default:
      };
    });
  });
};

function purchaseID() {
  connection.query("SELECT item_id FROM products", function(err, queryRes) {
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
      for (var i = 0; i < queryRes.length; i++) {
        if (queryRes[i].item_id == response.id){
          index = i;
          break;
        };
      };
      if (index >= 0) {
        // now check if qty is available
        purchaseQty(response.id);
      }
      else {
        console.log('Please enter a valid item ID');
        purchaseID();
      };
    });
  });
};

function purchaseQty(id) {
  connection.query("SELECT * FROM products WHERE ?", {item_id: id}, function(err, queryRes) {
    if (err) throw err;
    inquirer.prompt([
      {
        name: 'qty',
        type: 'input',
        message: 'Enter the quantity to purchase:',
        // validate: function(input) {
        //   if (typeof input === 'number') {
        //     return true;
        //   };
        //   return false;
        // }
      }
    ]).then(function(response) {
      // check if qty is available
      if (response.qty <= queryRes[0].stock_qty) {
        transactionConfirm('Sales Order', queryRes, response.qty);
      }
      else {
        console.log('That quantity is unavailable.');
        // return to prompt, and maybe catch type errors differently
        purchaseQty(id);
      };
    });
  });
};

function transactionConfirm(type, queryRes, qty) {
  // start with SO transaction type, then maybe PO, RMA, etc.
  orderQty = parseInt(qty);
  orderTotal = queryRes[0].price * orderQty;
  console.table(
    'Please review your order:', 
    [
      {
        item: queryRes[0].product_name,
        quantity: orderQty,
        subtotal: "$" + orderTotal
      }
    ]
  );
  inquirer.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      message:'Proceed with purchase?'
    }
  ]).then(function(response) {
    if (response.confirm) {
      console.log('Making purchase...');

      // get the absolute most current stock_qty and then proceed with purchase:
      connection.query("SELECT * FROM products WHERE ?", [{item_id: queryRes[0].item_id}], function(err, res) {
        // catch the stock qty and subtract the order qty
        var updatedQty = res[0].stock_qty - orderQty;
        connection.query(
          "UPDATE products SET ? WHERE ?",
          [
            {
              stock_qty: updatedQty
            },
            {
              item_id: queryRes[0].item_id
            }
          ],
          function(err, res) {
            console.log('Your order total was $' + orderTotal + ". Please check your email for order confirmation and tracking. HAH! Just kidding! This thing has zero email capabilities.");
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
      choices: ['View products', 'Get me out of here'],
      message: 'What would you like to do?'
    }
  ]).then(function(response) {
    switch (response.action) {
      case 'View products':
        customerPrompt();
        break;
      case 'Get me out of here':
        connection.end();
        break;
      default:
    };
  });
}



// NOTES