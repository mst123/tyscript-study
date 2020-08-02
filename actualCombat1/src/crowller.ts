
import fs from 'fs'
import path from 'path'
import superagent from 'superagent' //需要安装声明文件
import DellAnalyzer from './dellAnalyzer'

class Crowller {
  private secret = 'secretKey';
  private url = `http://www.dell-lee.com/typescript/demo.html?secret=${this.secret}`;
  private filePath = path.resolve(__dirname, '../data/course.json')
  constructor(private analyzer: any) {
    this.initSpiderProcess()
  }
  async initSpiderProcess() { //初始化爬虫
    const html = await this.getRawHtml()
    const fileContent = this.analyzer.analyze(html.text, this.filePath)
    this.writeFile(fileContent)
  }
  async getRawHtml() { //得到页面
    return await superagent.get(this.url);
  }
  writeFile(content: string) {//写文件
    fs.writeFileSync(this.filePath, content)
  }
}
const analyzer = new DellAnalyzer()
const crowller = new Crowller(analyzer)