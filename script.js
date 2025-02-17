/*
 * Issues: checked boxes are not restored
 * Add: ability to edit todos
 * Add: show todos, hide todos, search
 * Add: clear todos
 */
let todoId = 0;
let todos = [];
let currentDelBtn = null;
let todoList = document.querySelector("#todoList");

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

function addTodoItemCallback(e, text) {
    text = text.trim();
    if (e.key === "Enter" && text !== "" && !todos.includes(text)) {
        todos.push(text);
        let newTodo = createTodoItem(todoId++, text);
        let todoText = newTodo.querySelector("label");
        let deleteTodoBtn = createDeleteBtn();
        todoText.addEventListener("mouseenter", () => {
            if (currentDelBtn) {
                currentDelBtn.remove();
            }
            currentDelBtn = deleteTodoBtn;
            newTodo.append(deleteTodoBtn);
            deleteTodoBtn.addEventListener("click", () => {
                todos = todos.filter(todo => todo !== text);
                newTodo.remove();
                localStorage.setItem('todos', JSON.stringify(todos));
            });
        });
        todoText.addEventListener("mouseout", () => {
            setTimeout(() => {
                if (currentDelBtn) {
                    currentDelBtn.remove();
                    currentDelBtn = null;
                }
            }, 5000);
        });
        todoList.append(newTodo);
        addTodo.value = "";
        localStorage.setItem('todos', JSON.stringify(todos));
    }
}

let addTodoBtn = document.querySelector("#addTodoBtn");
let addTodo = document.querySelector("#addTodo");
addTodoBtn.addEventListener("click", () => addTodoItemCallback({ key: "Enter" }, addTodo.value));
addTodo.addEventListener("keydown", (e) => addTodoItemCallback(e, addTodo.value));
if (localStorage.getItem('todos')) {
    let oldTodos = JSON.parse(localStorage.getItem('todos'));
    for (todo of oldTodos) {
        addTodoItemCallback({ key: "Enter"}, todo);
    }
}
document.addEventListener("beforeunload", () => {
    localStorage.setItem('todos', JSON.stringify(todos));
});
