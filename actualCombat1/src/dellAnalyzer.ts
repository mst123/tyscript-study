import fs from 'fs'
import cheerio from 'cheerio'
import { Analyzer } from './crowller'
interface Course {
  title: string;
  count: number;
}
interface CourseResult {
  time: number;
  data: Course[]
}
interface Content {
  [prop: string]: Course[]
}

export default class DellAnalyzer implements Analyzer{
  private constructor(){ }
  private static instance: DellAnalyzer
  static getInstance(){ // 这个方式也是static！！！！
    if(!DellAnalyzer.instance){
      DellAnalyzer.instance = new DellAnalyzer()
    }
    return DellAnalyzer.instance
  }
  private getCourceInfo(html: string ){ //分析页面内容
    const $ = cheerio.load(html);
    const courseItems = $('.course-item');
    const courseInfos: Course[] = []
    courseItems.map((index, element) => {
      const descs = $(element).find('.course-desc');
      const title = descs.eq(0).text();
      const count = Math.floor(Math.random()*100);
      courseInfos.push({
        title,
        count
      })
    })
    return {
      time: new Date().getTime(),
      data: courseInfos
    }
  }
  private generateJsonContent(courseInfo: CourseResult, filePath: string) {//读取文件，提供书写内容
    let fileContent: Content = {}
    if(fs.existsSync(filePath)){
      fileContent = JSON.parse (fs.readFileSync(filePath, 'utf-8'))
    }
    fileContent[courseInfo.time] = courseInfo.data
    return fileContent
  }
  public analyze(html: string, filePath: string) {
    const courseInfo = this.getCourceInfo(html)
    const fileContent = this.generateJsonContent(courseInfo, filePath)
    return JSON.stringify(fileContent)
  }
}