const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;
const intializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Databse Error is: ${error.message}`);
    process.exit(1);
  }
};
intializeDBandServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, Response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status='${status}' AND
                priority='${priority}';`;
          data = await database.all(getTodosQuery);
          Response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          Response.status(400);
          Response.send("Invalid Todo Status");
        }
      } else {
        Response.status(400);
        Response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND
                status='${status}';`;
          data = await database.all(getTodosQuery);
          Response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          Response.status(400);
          Response.send("Invalid Todo Status");
        }
      } else {
        Response.status(400);
        Response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND
                priority='${priority}';`;
          data = await database.all(getTodosQuery);
          Response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          Response.status(400);
          Response.send("Invalid Todo Priority");
        }
      } else {
        Response.status(400);
        Response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE
                priority='${priority}';`;
        data = await database.all(getTodosQuery);
        Response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        Response.status(400);
        Response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE
                status='${status}';`;
        data = await database.all(getTodosQuery);
        Response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        Response.status(400);
        Response.send("Invalid Todo Status");
      }

      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      Response.send(data.map((eachItem) => outPutResult(eachItem)));
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`;
        data = await database.all(getTodosQuery);
        Response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        Response.status(400);
        Response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await database.all(getTodosQuery);
      Response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

//API 2
app.get("/todos/:todoId/", async (request, Response) => {
  const { todoId } = request.params;
  const getToDoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  Response.send(outPutResult(responseResult));
});

//API 3
app.get("/agenda/", async (request, Response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo WHERE 
        due_date='${newDate}';`;
    const responseResult = await database.all(requestQuery);
    Response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    Response.status(400);
    Response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, Response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo 
                    (id,todo,category,priority,status,due_date) VALUES
                    (${id},'${todo}','${category}','${priority}', '${status}','${postNewDueDate}');`;
          await database.run(postTodoQuery);
          Response.send("Todo Successfully Added");
        } else {
          Response.status(400);
          Response.send("Invalid Due Date");
        }
      } else {
        Response.status(400);
        Response.send("Invalid Todo Category");
      }
    } else {
      Response.status(400);
      Response.send("Invalid Todo Status");
    }
  } else {
    Response.status(400);
    Response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, Response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
    
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = ` UPDATE todo SET
              todo='${todo}',
              priority='${priority}',
              status='${status}',
              category='${category}',
              due_date=${dueDate},
              WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        Response.send("Status Updated");
      } else {
        Response.status(400);
        Response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = ` UPDATE todo SET
              todo='${todo}',
              priority='${priority}',
              status='${status}',
              category='${category}',
              due_date='${dueDate}',
              WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        Response.send("Priority Updated");
      } else {
        Response.status(400);
        Response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = ` UPDATE todo SET
              todo='${todo}',
              priority='${priority}',
              status='${status}',
              category='${category}',
              due_date='${dueDate}',
              WHERE id=${todoId};`;
      await database.run(updateTodoQuery);
      Response.send("Todo Updated");

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = ` UPDATE todo SET
              todo='${todo}',
              priority='${priority}',
              status='${status}',
              category='${category}',
              due_date='${dueDate}',
              WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        Response.send("Category Updated");
      } else {
        Response.status(400);
        Response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = ` UPDATE todo SET
              todo='${todo}',
              priority='${priority}',
              status='${status}',
              category='${category}',
              due_date='${dueDate}',
              WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        Response.send("Due Date Updated");
      } else {
        Response.status(400);
        Response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, Response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteTodoQuery);
  Response.send("Todo Deleted");
});

module.exports = app;
