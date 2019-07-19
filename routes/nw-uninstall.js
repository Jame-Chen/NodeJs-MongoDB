let Service = require('node-windows').Service;

    let svc = new Service({
      name: 'Mongodb附件服务',    //服务名称
      description: 'Mongodb附件服务', //描述
        script: 'F:\cj\NodeJs\myapp\routes\my-app.js' //nodejs项目要启动的文件路径
    });

  svc.on('uninstall',function(){
      console.log('Uninstall complete.');
      console.log('The service exists: ',svc.exists);
    });
