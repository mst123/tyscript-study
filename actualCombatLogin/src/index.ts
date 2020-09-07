import express, {Request, Response, NextFunction} from "express";
import router from "./router"
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['falsfal']
}))
app.use(router);
app.listen(7001, () => {
  console.log("server is running http://localhost:7001");
  
})