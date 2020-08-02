
class Demo{
  private static instance: any;//Demo
  private constructor(){

  }
  static getInstance(){
    if(this.instance){
      this.instance = new Demo()
    }
    return this.instance
  }
}
console.log(Demo.getInstance()===Demo.getInstance());
