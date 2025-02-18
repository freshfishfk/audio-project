import React from 'react'

// 定义 About 组件的类型
type AboutProps = object

const About: React.FC<AboutProps> = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">关于我们</h1>
      <p className="text-lg text-gray-600">这是关于页面的内容</p>
    </div>
  )
}

export default About