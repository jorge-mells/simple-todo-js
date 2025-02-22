/*
 * Add: ability to edit todos
 * Add: show todos, hide todos, search
 * Add: clear todos
 */
let todoId = 0;
let todos = [];
let checked = [];
let currentDelBtn = null;
let todoList = document.querySelector("#todoList");
let addTodoBtn = document.querySelector("#addTodoBtn");
let addTodo = document.querySelector("#addTodo");

function showTodos() {
    let todoList = document.querySelector("#todoList");
    if (!todoList) {
        let todoBox = document.querySelector("#todoBox");
        todoBox.append(window.todoList);
    }
}

function hideTodos() {
    let todoList = document.querySelector("#todoList");
    if (todoList) {
        todoList.remove();
    }
}

function createDeleteBtn() {
    let deleteTodoBtn = document.createElement("button");
    deleteTodoBtn.type = "button";
    deleteTodoBtn.className = "deleteTodoBtn";
    deleteTodoBtn.textContent = "Delete Todo";
    return deleteTodoBtn;
}

function createTodoItem(id, content) {
    let todoItem = document.createElement("div");
    todoItem.className = "todoItem";
    todoItem.innerHTML = `
        <input type="checkbox" id="todoItem${id}" name="scales" />
        <label for="todoItem${id}">${content}</label>
`;
    return todoItem;
}

function addDelBtnCallback(deleteTodoBtn, newTodo, text) {
    if (currentDelBtn) {
        currentDelBtn.remove();
    }
    currentDelBtn = deleteTodoBtn;
    newTodo.append(deleteTodoBtn);
    deleteTodoBtn.addEventListener("click", () => deleteTodoCallback(newTodo, text));
}

function deleteTodoCallback(newTodo, text) {
    todos = todos.filter(todo => todo !== text);
    newTodo.remove();
    localStorage.setItem('todos', JSON.stringify(todos));
}

function removeDelBtnCallback() {
    setTimeout(() => {
        if (currentDelBtn) {
            currentDelBtn.remove();
            currentDelBtn = null;
        }
    }, 5000);
}
/**
 * Record changes in the state of a todo item
 * @param {object} event - Must contain the input element which changed
 */
function checkChangeCallback(e) {
    let inputElement = e.target;
    let index = inputElement.id.at(-1);
    index = parseInt(index);
    checked[index] = !checked[index];
    localStorage.setItem('checked', JSON.stringify(checked));
}

function addTodoItemCallback(e, text) {
    text = text.trim();
    if (e.key === "Enter" && text !== "" && !todos.includes(text)) {
        todos.push(text);
        let newTodo = createTodoItem(todoId++, text);
        let todoText = newTodo.querySelector("label");
        let deleteTodoBtn = createDeleteBtn();
        todoText.addEventListener("mouseenter", () => addDelBtnCallback(deleteTodoBtn, newTodo, text));
        todoText.addEventListener("mouseout", removeDelBtnCallback);
        todoList.append(newTodo);
        addTodo.value = "";
        localStorage.setItem('todos', JSON.stringify(todos));
        checked.push(e?.checkState ?? false);
        let inputEle = newTodo.querySelector("input");
        inputEle.checked = e?.checkState ?? false;
        inputEle.addEventListener("change", checkChangeCallback);
        localStorage.setItem('checked', JSON.stringify(checked));
    }
}

(function initialise() {
    if (localStorage.getItem('todos')) {
        let oldTodos = JSON.parse(localStorage.getItem('todos'));
        let oldCheckState = JSON.parse(localStorage.getItem('checked'));
        for ([index, todo] of oldTodos.entries()) {
            addTodoItemCallback({ key: "Enter", checkState: oldCheckState?.[index] }, todo);
        }
    }
    document.addEventListener("beforeunload", () => {
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('checked', JSON.stringify(checked));
    });
    addTodoBtn.addEventListener("click", () => addTodoItemCallback({ key: "Enter" }, addTodo.value));
    addTodo.addEventListener("keydown", (e) => addTodoItemCallback(e, addTodo.value));
})();
