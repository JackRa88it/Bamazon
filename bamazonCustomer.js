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
  connection.query("SELECT products.id AS ID, products.name AS Product, departments.name AS Department, products.price AS Price FROM products LEFT JOIN departments ON products.id_departments = departments.id ORDER BY products.id", function(err, res) {
    if (err) throw err;
    console.table('Bamazon Catalog', res);
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
          salesOrder();
          break;
        case 'Get me out of here':
          connection.end();
          break;
        default:
      };
    });
  });
};

function salesOrder() {
  connection.query("SELECT * FROM products", function(err, res) {
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
        // TRY PARSE INT
      }
    ]).then(function(response) {
      // check if id is a valid item
      var index = -1;
      for (var i = 0; i < res.length; i++) {
        if (response.id == res[i].id){
          index = i;
          break;
        };
      };
      if (index >= 0) {
        // now check if qty is available
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
          if (response.qty <= res[index].stock_qty) {
            transaction('Sales Order', res[index], response.qty);
          }
          else {
            console.log('That quantity is unavailable.');
            // return to prompt, and maybe catch type errors differently
            salesOrder();
          };
        });
      }
      else {
        console.log('Please enter a valid item ID');
        salesOrder();
      };
    });
  });
};

function transaction(type, queryRecord, qty) {
  // start with SO transaction type, then maybe PO, RMA, etc.
  orderQty = parseInt(qty);
  orderTotal = queryRecord.price * orderQty;
  console.table(
    'Please review your order:', 
    [
      {
        Item: queryRecord.name,
        Quantity: orderQty,
        Subtotal: "$" + orderTotal
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
      connection.query("SELECT * FROM products WHERE ?", [{id: queryRecord.id}], function(err, res) {
        // NOTE: ERROR CATCH HERE WITH IF STATEMENT ON AVAILABLE QTY
        // catch the stock qty and subtract the order qty
        var updatedQty = res[0].stock_qty - orderQty;
        var updatedSales = res[0].sales + orderTotal;
        connection.query(
          "UPDATE products SET ? WHERE ?",
          [
            {
              stock_qty: updatedQty,
              sales: updatedSales
            },
            {
              id: res[0].id
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