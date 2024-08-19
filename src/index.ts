import { createInMemoryApp, createSQLApp } from "./controllers/main";

//const app = createInMemoryApp(); // Use this for in-memory storage
const app = createSQLApp(); // Use this for SQL storage

export default app;
