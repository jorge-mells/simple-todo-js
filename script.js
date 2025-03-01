// get the necessary components for the page
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentEdit = -1;
let search = document.querySelector("#search-task");
let todoContainer = document.querySelector("#task-container");
let addTodo = document.querySelector("#add-task");
let addTodoBtn = document.querySelector("#add-task-btn");
let allBtn = document.querySelector("#all-btn");
let completedBtn = document.querySelector("#completed-btn");
let activeBtn = document.querySelector("#active-btn");
let clearImg = document.querySelector("#clear-img");

/*
 * get which regions of the text should be highlighted or not
 * @param {object} matches - the iterator returned by matchAll
 * @param {string} searchedText - the text you intend to reconstruct
 * @returns {Array<Array<string, boolean>>} Each text section and whether they should be highlighted or not
 */
function reconstructSearchedText(matches, searchedText) {
    let reconstructedArr = [];
    // mark start of searchedText
    let i = 0;
    for (match of matches) {
        for (indexArr of match.indices) {
            let start = indexArr[0], end = indexArr[1];
            // get the part you shouldn't highlight in front of the indexArr
            if (i < start) {
                reconstructedArr.push([searchedText.slice(i, start), false]);
                i = start;
            }
            // get the part you should highlight
            if (start === i) {
                reconstructedArr.push([searchedText.slice(start, end), true]);
                i = end;
                continue;
            }
            // ensure there are no errors
            if (i > start) {
                console.error("the position of the pointer should be at most at the start of the index array");
            }
        }
    }
    // ensure that all the text has been captured and add any leftover
    if (i !== searchedText.length) {
        reconstructedArr.push([searchedText.slice(i, searchedText.length + 1), false]);
    }
    return reconstructedArr;
}

/*
 * modify each todo to account for searches
 * @param {string} currentSearch - the term currently being searched
 * @param {Array<object>} activeTodos - the todos being searched
 * @returns {Array<object>} the modified todos and found results
 */
function findSearches(currentSearch, activeTodos) {
    if (!currentSearch) return activeTodos;
    let length = activeTodos.length
    let staticArr = Array.from(activeTodos);
    for (let index = length - 1; index >= 0; index--) {
        let todo = staticArr[index];
        // ignore case and ensure an indexArray is returned for each match
        // only perform literal matches
        currentSearch = currentSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let searchRegex = new RegExp(currentSearch, "gdi");
        let matches = todo.text.matchAll(searchRegex);
        let resultArr = reconstructSearchedText(matches, todo.text);
        if (resultArr.length === 1) {
            activeTodos.splice(index, 1);
            continue;
        }
        todo.searchedText = resultArr;
    }
    return activeTodos;
}

/*
 * find which filter button is currently active
 * @returns {string} "all", or "completed", or "active"
 */
function findFilterBtn() {
    let isAllFilter = allBtn.classList.contains("selected");
    if (isAllFilter) return "all";
    let isCompletedFilter = completedBtn.classList.contains("selected");
    if (isCompletedFilter) return "completed";
    let isActiveFilter = activeBtn.classList.contains("selected");
    if (isActiveFilter) return "active";
}

// create new components to be added to the page
let addTodoBanner = null;
let foundBanner = null;
let noResultsBanner = null;
let statsBanner = null;
let noTaskMatch = null;
/*
 * create elements which only need to be created once
 */
function createStaticElements() {
    // banner to display for no todos
    addTodoBanner = document.createElement("li");
    addTodoBanner.classList.add("filter-none", "stats");
    addTodoBanner.textContent = "Add your first todo item";
    noTaskMatch = document.createElement("li");
    noTaskMatch.classList.add("filter-none", "stats");
    noTaskMatch.textContent = "No tasks match the current filter";
}

/*
 * create a component that shows how many items have been found
 * @param {number} numberOfResults - how many items have been found
 * @param {text} currentSearch - the currently searched term
 */
function createFoundBanner(numberOfResults, currentSearch) {
    // banner to display for searches
    foundBanner = document.createElement("li");
    foundBanner.classList.add("filter-text", "stats");
    foundBanner.textContent = `Found ${numberOfResults} for "${currentSearch}"`;
}

/*
 * create a component that displays that no results have been found
 * @param {search} currentSearch - The text currently in the search bar
 */
function createNoResultsBanner(currentSearch) {
    // banner to display for no results
    noResultsBanner = document.createElement("li");
    noResultsBanner.classList.add("filter-none", "stats");
    noResultsBanner.textContent = `No results found for "${currentSearch}"`;
}

/*
 * create a component that displays how many total, active and completed todos there are
 * @param {number} total - the total number of todos
 * @param {number} active - the number of incomplete todos
 * @param {number} completed - the number of completed todos
 */
function createStatsBanner(total, active, completed) {
    // banner to display statistics
    statsBanner = document.createElement("p");
    statsBanner.classList.add("stats");
    statsBanner.textContent = `${total} total, ${active} active, ${completed} completed`;
}

/*
 * a callback to rerender todos when a todo is completed
 * @param {object} todo - the todo which has just been completed
 */
function checkedTodoCallback(todo) {
    todo.completed = !todo.completed;
    localStorage.setItem("todos", JSON.stringify(todos));
    render();
}

/*
 * a callback to rerender todos when a todo is currently being edited
 * @param {number} index - the index of the todo in the todos array being edited
 */
function editTodoCallback(index) {
    currentEdit = index;
    render();
}

/*
 * a callback to rerender todos when a todo has just been deleted
 * @param {number} index - the index of the todo in the todos array being edited
 */
function delBtnCallback(index) {
    todos.splice(index, 1);
    // fix id issues
    for (let i = 0; i < todos.length; i++) {
        todos[i].id = i;
    }
    localStorage.setItem("todos", JSON.stringify(todos));
    render();
}

/*
 * a callback to rerender todos after a completed edit
 * @param {object} todo - the todo which has just been completed
 * @param {string} newText - the text that was just entered to replace the old todo
 */
function saveBtnCallback(todo, newText) {
    todo.text = newText;
    localStorage.setItem("todos", JSON.stringify(todos));
    currentEdit = -1;
    render();
}

/*
 * a callback to rerender todos after a canceled edit
 */
function cancelBtnCallback() {
    currentEdit = -1;
    render();
}

/*
 * create a new todo item component
 * @param {number} index - the id (index in todos array) of the todo whose component is to be created
 * @returns {Element} the new component that has been created  
 */
function createTodoItem(index) {
    let todo = todos[index];
    let { text, completed } = todo;
    let newItem = document.createElement("li");
    newItem.classList.add("task-item");
    let input = document.createElement("input");
    input.type = "checkbox";
    input.checked = completed || false;
    if (completed) {
        newItem.classList.add("completed");
    }
    input.addEventListener("change", () => checkedTodoCallback(todo));
    newItem.append(input);
    if (index !== currentEdit) {
        let label = document.createElement("label");
        label.classList.add("todo-text");
        label.textContent = text;
        if (completed) {
            label.classList.add("completed");
        }
        newItem.append(label);
        let editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editTodoCallback(index)); 
        newItem.append(editBtn);
        let delBtn = document.createElement("button");
        delBtn.classList.add("del-btn");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => delBtnCallback(index));
        newItem.append(delBtn);
        return newItem;
    } else {
        let input = document.createElement("input");
        input.type = "text";
        input.classList.add("edit-task", "todo-text");
        input.value = text;
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") saveBtnCallback(todo, input.value);
        });
        newItem.append(input);
        let saveBtn = document.createElement("button");
        saveBtn.classList.add("save-btn");
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => saveBtnCallback(todo, input.value));
        newItem.append(saveBtn);
        let cancelBtn = document.createElement("button");
        cancelBtn.classList.add("cancel-btn");
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => cancelBtnCallback(index));
        newItem.append(cancelBtn);
        return newItem;
    }
}

/*
 * render items onto the screen
 */
function render() {
    // remove content that has remained from a previous render
    for (child of Array.from(todoContainer.children)) {
        child.remove();
    }
    todoContainer.nextElementSibling?.remove();
    // get todos if available
    let totalTodos = todos.length;
    let activeTodos = JSON.parse(JSON.stringify(todos));
    // show the x button
    if (!search.value) {
        clearImg.classList.remove("show");
    } else {
        clearImg.classList.add("show");
    }
    // filter todos according to search
    // only display this text if no search is performed and there are no todos
    if (!search.value && totalTodos === 0) {
        todoContainer.append(addTodoBanner);
        createStatsBanner(0, 0, 0);
        todoContainer.after(statsBanner);
        return;
    }
    activeTodos = findSearches(search.value, activeTodos);
    let numberOfResults = activeTodos.length;
    // filter todos according to the filter buttons
    let activeFilter = findFilterBtn();
    let completed = todos.filter((todo) => todo.completed).length;
    if (activeFilter === "completed") {
        activeTodos = activeTodos.filter((todo) => todo.completed);
    }
    if (activeFilter === "active") {
        let all = todos.length;
        activeTodos = activeTodos.filter((todo) => !todo.completed);
        completed = all - todos.filter((todo) => !todo.completed).length;
    }
    // render stats banner already
    createStatsBanner(totalTodos, totalTodos - completed, completed);
    todoContainer.after(statsBanner);
    // show that nothing can be found if there are 0 finds for a search
    if (search.value && numberOfResults === 0) {
        createFoundBanner(0, search.value);
        todoContainer.append(foundBanner);
        createNoResultsBanner(search.value);
        todoContainer.append(noResultsBanner);
        return;
    }
    // just show only based on filter if something searched but the filtered result is empty
    let activeCompleted = activeTodos.filter((todo) => todo.completed).length;
    if (activeFilter === "completed" && activeCompleted === 0) {
        if (search.value) {
            createFoundBanner(numberOfResults, search.value);
            todoContainer.append(foundBanner);
            todoContainer.append(noTaskMatch);
            return;
        } else {
            todoContainer.append(noTaskMatch);
            return;
        }
    }
    let numberActive = totalTodos - completed;
    let currentActive = numberOfResults - activeCompleted;
    if (activeFilter === "active" && (currentActive === 0 || activeTodos.length == 0)) {
        if (search.value) {
            createFoundBanner(numberOfResults, search.value);
            todoContainer.append(foundBanner);
            todoContainer.append(noTaskMatch);
            return;
        } else {
            todoContainer.append(noTaskMatch);
            return;
        }
    }
    // finally render the todos
    if (!search.value) {
        for (activeTodo of activeTodos) {
            let todo = createTodoItem(activeTodo.id);
            todoContainer.append(todo);
        }
    } else {
        createFoundBanner(numberOfResults, search.value);
        todoContainer.append(foundBanner);
        for (activeTodo of activeTodos) {
            let todo = createTodoItem(activeTodo.id);
            let label = todo.querySelector("label");
            if (!label) {
                todoContainer.append(todo);
                continue;
            }
            label.textContent = "";
            for ([substring, highlight] of activeTodo.searchedText) {
                if (highlight) {
                    let span = document.createElement("span");
                    span.classList.add("highlighted");
                    span.textContent = substring;
                    label.append(span);
                } else {
                    label.append(substring);
                }
            }
            todoContainer.append(todo);
        }
    }
}

/*
 * a callback to rerender todos after a todo has been created
 */
function addTodoCallback() {
    if (!addTodo.value) return;
    todos.push({ id: todos.length, text: addTodo.value, completed: false });
    localStorage.setItem("todos", JSON.stringify(todos));
    addTodo.value = "";
    render();
}

/*
 * a callback to rerender todos when a new filter button has been selected
 * @param {Event} event - the event object passed by the clicked button
 */
function filterChangeCallback(event) {
    let currentFilter = findFilterBtn();
    switch (currentFilter) {
        case "all":
            allBtn.classList.remove("selected");
            break;
        case "completed":
            completedBtn.classList.remove("selected");
            break;
        case "active":
            activeBtn.classList.remove("selected");
            break;
    }
    event.target.classList.add("selected");
    render();
}

/*
 * a callback to remove content when the cancel button is clicked
 */
function clearImgCallback() { 
    search.value = "";
    render(); 
}

/*
 * create all other relevant event listeners
 */
function createListeners() {
    search.addEventListener("input", render);
    clearImg.addEventListener("click", clearImgCallback);
    addTodo.addEventListener("keydown", (event) => {
        if (event.key === "Enter") addTodoCallback();
    });
    addTodoBtn.addEventListener("click", addTodoCallback);
    allBtn.addEventListener("click", filterChangeCallback);
    completedBtn.addEventListener("click", filterChangeCallback);
    activeBtn.addEventListener("click", filterChangeCallback);
}

createListeners();
createStaticElements();
render();
