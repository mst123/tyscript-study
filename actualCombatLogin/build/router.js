"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dellAnalyzer_1 = __importDefault(require("./dellAnalyzer"));
const router = express_1.Router();
router.get("/login", (req, res) => {
    res.send(`
    <html>
      <body>
        <form method="post" action="/getData">
          <input type="password" name="password" />
          <button>提交</button> 
        </form>
      </body>
    </html>
  `);
});
router.post("/getData", (req, res) => {
    if (req.body.password === "123") {
        const secret = 'secretKey';
        const url = `http://www.dell-lee.com/typescript/demo.html?secret=${secret}`;
        const analyzer = dellAnalyzer_1.default.getInstance();
        res.send("getData success");
    }
    else {
        res.send("password error");
    }
});
exports.default = router;
