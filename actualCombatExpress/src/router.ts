import { Router, Request, Response } from "express";
import Crowller from "./crowller";
import DellAnalyzer from './dellAnalyzer';

interface RequestWithBody extends Request{ // 当.d.ts 文件描述不准确时，可以这样补充
  body: {
    [key: string]: string | undefined;
  }
}
const router = Router();
router.get("/login", (req: Request, res: Response) => {
  res.send(`
    <html>
      <body>
        <form method="post" action="/getData">
          <input type="password" name="password" />
          <button>提交</button> 
        </form>
      </body>
    </html>
  `)
});
router.post("/getData", (req: RequestWithBody, res: Response) => {
  const { password } = req.body;
  if (password === "123") {
    const secret = 'secretKey';
    const url = `http://www.dell-lee.com/typescript/demo.html?secret=${secret}`;
    const analyzer = DellAnalyzer.getInstance();
    res.send("getData success");
  } else {
    res.send(`${req.teacherName} password error`);
  }
  
});

export default router;