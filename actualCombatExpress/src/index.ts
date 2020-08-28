import express, {Request, Response, NextFunction} from "express";
import router from "./router"
import bodyParser from 'body-parser';
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  // 使用了类型融合 custom.d.ts 
  req.teacherName = "mst";
  next();
})


app.use(router);
app.listen(7001, () => {
  console.log("server is running http://localhost:7001");
  
})