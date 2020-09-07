import { Router, Request, Response } from "express";
import Crowller from "./crowller";
import DellAnalyzer from './dellAnalyzer';

interface RequestWithBody extends Request{ // 当.d.ts 文件描述不准确时，可以这样补充
  body: {
    [key: string]: string | undefined;
  }
}
const router = Router();
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <body>
        <form method="post" action="/getData">
          <input type="password" name="password" />
          <button>登陆</button> 
        </form>
      </body>
    </html>
  `)
});
router.post("/login", (req: RequestWithBody, res: Response) => {
  const { password } = req.body;
  const isLogin: boolean = req.session ? req.session.login : false;
  if (isLogin) {
    res.send("已经登录过");
  } else {
    if (password === "123") {
      if (req.session) {
        req.session.login = true;
        res.send("登陆成功");
      }
    } else {
      res.send("登陆失败");
    }
  }
  
});
router.post("/getData", (req: RequestWithBody, res: Response) => {
  const { password } = req.body;
  if (password === "123") {
    const secret = 'secretKey';
    const url = `http://www.dell-lee.com/typescript/demo.html?secret=${secret}`;
    const analyzer = DellAnalyzer.getInstance();
    res.send("getData success");
  } else {
    res.send("password error");
  }
});

export default router;