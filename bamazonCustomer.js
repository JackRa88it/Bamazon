var mysql = require('mysql');
var inquirer = require('inquirer');
const cTable = require('console.table');
// variable for locally storing products table (for validating inputs without re-querying database all the time):
var returnedTable;

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  customerPrompt();
});

// connect and display table of items before prompting user input:
function customerPrompt() {
  connection.query("SELECT item_id, product_name, dept_name, price FROM products", function(err, res) {
    if (err) throw err;
    // store the table locally on global level and then display:
    returnedTable = res;
    console.table(res);
    // prompt user:
    inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        choices: ['buy product', 'get me out of here'],
        message: 'What would you like to do?'
      }
    ]).then(function(response) {
      switch (response.action) {
        case 'buy product':
          buyProduct();
          break;
        case 'get me out of here':
          connection.end();
          break;
        default:
      };
    });
  });
};

function buyProduct() {
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
    },
    {
      name: 'qty',
      type: 'input',
      message: 'Enter the quantity you wish to purchase:',
      // validate: function(input) {
      //   if (typeof input === 'number') {
      //     return true;
      //   };
      //   return false;
      // }
    }
  ]).then(function(response) {
    console.log(returnedTable);
    // connection.query("SELECT * FROM products WHERE ?", {dept_name: response.dept}, function(err, res) {
    //   if (err) throw err;
    //   console.table(res);
    //   connection.end();
    // });
  });
};

// NOTES
// disguise field names when table displays