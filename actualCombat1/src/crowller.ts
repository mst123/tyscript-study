import fs from 'fs'
import path from 'path'
import superagent from 'superagent' //需要安装声明文件
import DellAnalyzer from './dellAnalyzer'

export interface Analyzer {
  analyze: (html: string, path: string) => string;
}
class Crowller {
  private filePath = path.resolve(__dirname, '../data/course.json')
  constructor(private analyzer: Analyzer, private url: string) {
    this.initSpiderProcess()
  }
  private async initSpiderProcess() { //初始化爬虫
    const html = await this.getRawHtml()
    const fileContent = this.analyzer.analyze(html, this.filePath)
    this.writeFile(fileContent)
  }
  private async getRawHtml() { //得到页面
    const html = await superagent.get(this.url)
    return html.text 
  }
  private writeFile(content: string) {//写文件
    fs.writeFileSync(this.filePath, content)
  }
}
const secret = 'secretKey';
const url = `http://www.dell-lee.com/typescript/demo.html?secret=${secret}`;
const analyzer = DellAnalyzer.getInstance()
new Crowller(analyzer, url )