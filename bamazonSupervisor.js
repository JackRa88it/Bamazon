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
  supervisorPrompt();
});

function supervisorPrompt() {
  inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      choices: ['View product sales by department', 'Create new department', 'Get me out of here'],
      message: 'What would you like to do?'
    }
  ]).then(function(response) {
    switch (response.action) {
      case 'View product sales by department':
        viewSalesByDept();
        break;
      case 'Create new department':
        createDept();
        break;
      case 'Get me out of here':
        connection.end();
        break;
      default:
    };
  });
};

function viewSalesByDept() {
  var query = "SELECT departments.dept_id AS 'Dept ID', departments.dept_name as Department, departments.overhead_costs AS Overhead, SUM(products.product_sales) AS Sales, SUM(products.product_sales)-departments.overhead_costs AS 'Profit/Loss'";
  query += " FROM departments";
  query += " LEFT JOIN products ON departments.dept_name = products.dept_name";
  query += " GROUP BY departments.dept_id";
  connection.query(query, function(err, res) {
      console.table('Sales by Department', res);
      supervisorPrompt();
  });
};

function createDept() {
  // using a connection.query to start it off so that I can later add validation against existing values
  connection.query("SELECT * FROM departments", function(err, res) {
    inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Please enter a department name'
      },
      {
        name: 'overhead',
        type: 'input',
        message: 'Please enter the monthly overhead cost'
      }
    ]).then(function(response) {
      connection.query("INSERT INTO departments SET ?",
        {
          dept_name: response.name,
          overhead_costs: response.overhead
        },
        function(err, res) {
          console.log(res.affectedRows + " department added!\n");
          supervisorPrompt();
        }
      );
    });
  });
};

// NOTES