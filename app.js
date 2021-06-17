const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server is starting at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Get All Todos API;
app.get("/todos/", async (request, response) => {
  let {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  status = status.replace("%20", " ");
  search_q = search_q.replace("%20", " ");
  priority = priority.replace("%20", " ");
  category = category.replace("%20", " ");
  if (
    status !== "" &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "" &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "" &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const getTodoQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate FROM 
        todo
        WHERE
        status LIKE '%${status}%' AND
        priority LIKE '%${priority}%' AND
        category LIKE '%${category}%' AND
        todo LIKE '%${search_q}%';`;
    const todos = await db.all(getTodoQuery);
    response.send(todos);
  }
});

//Get Todo From Todo Id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate FROM 
    todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//Get Todos With Given Due Date
app.get("/agenda/", async (request, response) => {
  const { date = "" } = request.query;
  if (isValid(new Date(date))) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
        WHERE
        due_date = '${formattedDate}';`;
    const todos = await db.all(getTodosQuery);
    response.send(todos);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;

  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    const creteTodoQuery = `
       INSERT INTO todo
       (id, todo, priority, status, category, due_date)
       VALUES
       (${id},'${todo}','${priority}', '${status}', '${category}', '${formattedDate}'); `;
    await db.run(creteTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//Update Todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate FROM 
    todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(getTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    const updateTodoQuery = `
    UPDATE todo
    SET todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${dueDate}'
    WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    if (todo !== previousTodo.todo) {
      response.send("Todo Updated");
    } else if (priority !== previousTodo.priority) {
      response.send("Priority Updated");
    } else if (status !== previousTodo.status) {
      response.send("Status Updated");
    } else if (category !== previousTodo.category) {
      response.send("Category Updated");
    } else {
      response.send("Due Date Updated");
    }
  }
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
