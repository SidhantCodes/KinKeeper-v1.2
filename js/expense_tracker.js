$(document).ready(function () {
    const expenseForm = $("#expense-form");
    const expenseList = $("#expense-list");
    const totalAmountElement = $("#total-amount");
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    //Render expenses in tabular form
    function renderExpenses() {
        expenseList.empty();
        let totalAmount = 0;
        for (let i = 0; i < expenses.length; i++) {
            const expense = expenses[i];
            const expenseRow = $("<tr>").html(`
    <td>${expense.name}</td>
    <td>$${expense.amount}</td>
    <td class="delete-btn" data-id="${i}">Delete</td>
  `);
            expenseList.append(expenseRow);
            //Update total amount
            totalAmount += expense.amount;
        }
        //Update total amount display
        totalAmountElement.text(totalAmount.toFixed(2));
        //Save expenses to localStorage
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }

    //Add expense
    function addExpense(event) {
        event.preventDefault();
        const expenseName = $("#expense-name").val();
        const expenseAmount = parseFloat($("#expense-amount").val());
        //Clear form inputs
        $("#expense-name").val("");
        $("#expense-amount").val("");

        //Validate inputs
        if (expenseName === "" || isNaN(expenseAmount)) {
            alert("Please enter valid expense details.");
            return;
        }

        //Create new expense object
        const expense = {
            name: expenseName,
            amount: expenseAmount,
        };
        //Add expense to expenses array
        expenses.push(expense);
        renderExpenses();
    }

    //Delete expense
    function deleteExpense(event) {
        if ($(event.target).hasClass("delete-btn")) {
            //Get expense index from data-id attribute
            const expenseIndex = parseInt($(event.target).data("id"));

            //Remove expense from expenses array
            expenses.splice(expenseIndex, 1);
            renderExpenses();
        }
    }

    //Add event listeners
    expenseForm.on("submit", addExpense);
    expenseList.on("click", ".delete-btn", deleteExpense);

    //Render initial expenses on page load
    renderExpenses();
});