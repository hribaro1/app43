load('api_config.js');
load('api_gcp.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_pwm.js');
load('api_sys.js');
load('api_rpc.js');
load('api_gpio.js');
load('api_adc.js');

// set MQTT topics

let topicsubconfig = '/devices/' + Cfg.get('device.id') + '/config';
let topicsubcommand = '/devices/' + Cfg.get('device.id') + '/commands';
let topicsubcommandreset = '/devices/' + Cfg.get('device.id') + '/commands/reset';
let topicpubstate = '/devices/' + Cfg.get('device.id') + '/state';
let topicpubevents = '/devices/' + Cfg.get('device.id') + '/events/fan';
let topicpubeventshtml = '/devices/' + Cfg.get('device.id') + '/events/html';

// declare variables

let speed = Cfg.get('app.pwm.val');
let apphome = Cfg.get('app.home');
let appuser = Cfg.get('app.user');
let appname = Cfg.get('app.name');
let apppin = Cfg.get('app.pin');
let appcfgrst = Cfg.get('app.cfg.rst');
let apppwmtime = Cfg.get('app.pwm.time');
let apppwmgra = Cfg.get('app.pwm.gra');
let oldspeed = Cfg.get('app.old.speed');
let apppwmnight = Cfg.get('app.pwm.night');
let appnightspeed = Cfg.get('app.night.speed');
let appboosttime = Cfg.get('app.boost.time');
let appmodeboost = Cfg.get('app.mode.boost');
let appmodeavto = Cfg.get('app.mode.avto');
let appmodenight = Cfg.get('app.mode.night');
let appmodesummer = Cfg.get('app.mode.summer');

let speedpwm = 50;
let mqttconnection = false;
let mqttconnectionnew = true;
let args;

let pin0 = 25;  //numbers corespond to GPIO pins on ESP
let pin1 = 26;
let pin2 = 27;
let pin3 = 32;

let state0 = 0;
let state1 = 0;
let state2 = 0;
let state3 = 0;

// declare input modes for RF receiver pins

GPIO.set_mode(pin0, GPIO.MODE_INPUT);
GPIO.set_mode(pin1, GPIO.MODE_INPUT);
GPIO.set_mode(pin2, GPIO.MODE_INPUT);
GPIO.set_mode(pin3, GPIO.MODE_INPUT);


// functions declarations START

function setStateZero() {        //puting to 0 input states variables for RF reciver
  state0 = 0;
  state1 = 0;
  state2 = 0;
  state3 = 0;
  print ("States set to zero")
}

function setSpeed () {             //setting speed in percentage PWM based on speed value 1..4 and config parameter for start direction and speed value from server
  if (apppwmgra){
    //speedpwm=50+12*speed;
    if (speed===0){
      speedpwm=50;
    }
    if (speed===1){
      speedpwm=72;
    }
    if (speed===2){
      speedpwm=83;
    }
    if (speed===3){
      speedpwm=87;
    }
    if (speed===4){
      speedpwm=91;
    }
  }else{
    //speedpwm=50-12*speed;
    if (speed===0){
      speedpwm=50;
    }
    if (speed===1){
      speedpwm=26;
    }
    if (speed===2){
      speedpwm=14;
    }
    if (speed===3){
      speedpwm=9;
    }
    if (speed===4){
      speedpwm=4;
    }
  }
  print("Hitrost nastavljena znotraj setSpeed na: ", speedpwm);
};


function SetOldSpeed() {   //setting speed in percentage PWM based on speed value 1..4 and config parameter for start direction based on oldspeed --> return fromboost
  
  if (apppwmgra){
    //speedpwm=50+12*speed;
    if (oldspeed===0){
      speedpwm=50;
    }
    if (oldspeed===1){
      speedpwm=72;
    }
    if (oldspeed===2){  
      speedpwm=83;
    }  
    if (oldspeed===3){
      speedpwm=87;
    }
    if (oldspeed===4){
      speedpwm=91;
    }
  }else{
    //speedpwm=50-12*speed;
    if (oldspeed===0){
      speedpwm=50;
    }
    if (oldspeed===1){
      speedpwm=26;
    }
    if (oldspeed===2){
      speedpwm=14;
    }
    if (oldspeed===3){
      speedpwm=9;
    }
    if (oldspeed===4){
      speedpwm=4;
    }
  }
  print("Hitrost nastavljena znotrja oldSpeed na: ", speedpwm);
};

function mqttReEstablished() {
 if (mqttconnectionnew === true){
  if (mqttconnection === false){
    let msg = JSON.stringify({type: "startupfan", domId: apphome, userId: appuser, currentFanSpeed: speed, timeChangeDirection: apppwmtime});
    print(topicpubstate, '->', msg);
    MQTT.pub(topicpubstate, msg, 1);
    print ("Objavi podatek na server ker je povezava nazaj --> MQTT connectionnew je: ", mqttconnectionnew);
    mqttconnection = mqttconnectionnew;
  } else {
    print ("MQTT povezava je vseskozi aktivna");
    mqttconnection = mqttconnectionnew;
  }
 } else {
  print ("Trenutna MQTT povezava je padla");
  mqttconnection = mqttconnectionnew;
 }
};


function pwmSlowSet() {

        //počasi nastavljaj hitrost
        if (speed===0){
          PWM.set(apppin, 1000, speedpwm/100);
          print("PWM set to % speed when 0:", speedpwm);
         };

         if (speed===1) {
           if (speedpwm>50){
             PWM.set(apppin, 1000, 38/100);
             print("PWM set to 38% speed when 1:");
             let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 1:");
            }, null);
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 62/100);
              print("PWM set to 62% speed when 1:");
            }, null);
            let delaytimer2 = Timer.set(6000, false, function () {
               PWM.set(apppin, 1000, speedpwm/100);
               print("PWM set to % speed when 1: ", speedpwm);
             }, null);
           } else {
             PWM.set(apppin, 1000, 62/100);
             print("PWM set to 62% speed when 1:");
             let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 1:");
            }, null); 
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 38/100);
              print("PWM set to 38% speed when 1:");
            }, null); 
            let delaytimer2 = Timer.set(6000, false, function () {
               PWM.set(apppin, 1000, speedpwm/100);
               print("PWM set to % speed when 1: ", speedpwm);
             }, null);
   
           }
         };
         
         if (speed===2) {
          if (speedpwm>50){
            PWM.set(apppin, 1000, 25/100);
            print("PWM set to 25% speed when 2:");
            let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 38/100);
              print("PWM set to 38% speed when 2:");
            }, null);
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 2:");
            }, null);
            let delaytimer2 = Timer.set(6000, false, function () {
              PWM.set(apppin, 1000, 62/100);
              print("PWM set to 62% speed when 2:");
            }, null);
            let delaytimer3 = Timer.set(8000, false, function () {
              PWM.set(apppin, 1000, 75/100);
              print("PWM set to 75% speed when 2:");
            }, null);
            let delaytimer4 = Timer.set(10000, false, function () {
              PWM.set(apppin, 1000, (speedpwm)/100);
              print("PWM set to % speed when 2: ", speedpwm);
            }, null);
  
          } else {
            PWM.set(apppin, 1000, 75/100);
            print("PWM set to 75% speed when 2:");
            let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 62/100);
              print("PWM set to 62% speed when 2:");
            }, null);
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 2:");
            }, null);
            let delaytimer2 = Timer.set(6000, false, function () {
              PWM.set(apppin, 1000, 38/100);
              print("PWM set to 38% speed when 2:");
            }, null);
            let delaytimer3 = Timer.set(8000, false, function () {
              PWM.set(apppin, 1000, 25/100);
              print("PWM set to 25% speed when 2:");
            }, null);
            let delaytimer4 = Timer.set(10000, false, function () {
              PWM.set(apppin, 1000, (speedpwm)/100);
              print("PWM set to % speed when 2: ", speedpwm);
            }, null);
          }
         };
 
         if (speed===3){
          if (speedpwm>50){
            PWM.set(apppin, 1000, 25/100);
            print("PWM set to 25% speed when 3:");
            let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 38/100);
              print("PWM set to 38% speed when 3:");
            }, null);
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 3:");
            }, null);
            let delaytimer2 = Timer.set(6000, false, function () {
              PWM.set(apppin, 1000, 62/100);
              print("PWM set to 62% speed when 3:");
            }, null);
            let delaytimer3 = Timer.set(8000, false, function () {
              PWM.set(apppin, 1000, 75/100);
              print("PWM set to 75% speed when 3:");
            }, null);
            let delaytimer4 = Timer.set(10000, false, function () {
              PWM.set(apppin, 1000, (speedpwm)/100);
              print("PWM set to % speed when 3: ", speedpwm);
            }, null);
  
          } else {
            PWM.set(apppin, 1000, 75/100);
            print("PWM set to 75% speed when 3:");
            let delaytimer = Timer.set(2000, false, function () {
              PWM.set(apppin, 1000, 62/100);
              print("PWM set to 62% speed when 3:");
            }, null);
            let delaytimer1 = Timer.set(4000, false, function () {
              PWM.set(apppin, 1000, 50/100);
              print("PWM set to 50% speed when 3:");
            }, null);
            let delaytimer2 = Timer.set(6000, false, function () {
              PWM.set(apppin, 1000, 38/100);
              print("PWM set to 38% speed when 3:");
            }, null);
            let delaytimer3 = Timer.set(8000, false, function () {
              PWM.set(apppin, 1000, 25/100);
              print("PWM set to 25% speed when 3:");
            }, null);
            let delaytimer4 = Timer.set(10000, false, function () {
              PWM.set(apppin, 1000, (speedpwm)/100);
              print("PWM set to % speed when 3: ", speedpwm);
            }, null);
          }


         };


          if (speed===4){
            if (speedpwm>50){
              PWM.set(apppin, 1000, 25/100);
              print("PWM set to 25% speed when 4:");
              let delaytimer = Timer.set(2000, false, function () {
                PWM.set(apppin, 1000, 38/100);
                print("PWM set to 38% speed when 4:");
              }, null);
              let delaytimer1 = Timer.set(4000, false, function () {
                PWM.set(apppin, 1000, 50/100);
                print("PWM set to 50% speed when 4:");
              }, null);
              let delaytimer2 = Timer.set(6000, false, function () {
                PWM.set(apppin, 1000, 62/100);
                print("PWM set to 62% speed when 4:");
              }, null);
              let delaytimer3 = Timer.set(8000, false, function () {
                PWM.set(apppin, 1000, 75/100);
                print("PWM set to 75% speed when 4:");
              }, null);
              let delaytimer4 = Timer.set(10000, false, function () {
                PWM.set(apppin, 1000, (speedpwm)/100);
                print("PWM set to % speed when 4: ", speedpwm);
              }, null);
    
            } else {
              PWM.set(apppin, 1000, 75/100);
              print("PWM set to 75% speed when 4:");
              let delaytimer = Timer.set(2000, false, function () {
                PWM.set(apppin, 1000, 62/100);
                print("PWM set to 62% speed when 4:");
              }, null);
              let delaytimer1 = Timer.set(4000, false, function () {
                PWM.set(apppin, 1000, 50/100);
                print("PWM set to 50% speed when 4:");
              }, null);
              let delaytimer2 = Timer.set(6000, false, function () {
                PWM.set(apppin, 1000, 38/100);
                print("PWM set to 38% speed when 4:");
              }, null);
              let delaytimer3 = Timer.set(8000, false, function () {
                PWM.set(apppin, 1000, 25/100);
                print("PWM set to 25% speed when 4:");
              }, null);
              let delaytimer4 = Timer.set(10000, false, function () {
                PWM.set(apppin, 1000, (speedpwm)/100);
                print("PWM set to % speed when 4: ", speedpwm);
              }, null);
            }
  
          


          };
   


 };


// functions declarations END


setSpeed(); //postavi ventilator na začetno hitrost kot nastavljeno v mos.yml parameter - app.pwm.val
print(speedpwm);
PWM.set(apppin, 1000, speedpwm/100);
mqttconnectionnew = MQTT.isConnected(); //preveri če je mqtt povezan

mqttReEstablished();   //izvede sinhronizacijo na server če prej mqtt ni bil povezan sedaj je pa spet


let oldtimer = Timer.set(apppwmtime, true, function() {
  speedpwm = 99-speed-speedpwm;
  print("PWM set to initial speed:", speedpwm);
  PWM.set(apppin, 1000, speedpwm/100);
  mqttconnectionnew = MQTT.isConnected();
  mqttReEstablished();
}, null);
 

// shranjevanje parametrov za konfiguracijo in status vsakih 10 minut

let configtimer = Timer.set(3600000, true, function() {

    // status
    Cfg.set({app: {pwm: {val: speed}}});
    Cfg.set({app: {mode: {avto: appmodeavto}}});
    Cfg.set({app: {mode: {night: appmodenight}}});
    Cfg.set({app: {mode: {summer: appmodesummer}}});
    Cfg.set({app: {mode: {boost: appmodeboost}}});

    //konfiguracija
    Cfg.set({app: {boost: {time: appboosttime}}});
    Cfg.set({app: {pwm: {night: apppwmnight}}});
    Cfg.set({app: {pwm: {gra: apppwmgra}}});
    Cfg.set({app: {night: {speed: appnightspeed}}});

}, null);



let boosttimer = Timer.set(appboosttime, true, function() {
 // define boosttimer
}, null);
print("Creating initial periodic boostimer: ", boosttimer);



MQTT.sub(topicsubconfig, function(conn, topic, msg) {
  //{“domId”: "dom", “userId”: "usernew", “name”: ”my-fan”, “nightFan”: ”true”, “groupA”: ”false”, "maxNightSpeed":2, "uploadFanConfig":true}
  if (appcfgrst) {
    print("First config from server skipped as device was reseted before --> app.cfg.rst set to FALSE");
    appcfgrst=false;
  } else {

      let obj = JSON.parse(msg) || {};
      appuser = obj.userId;
      appname = obj.name;
      apphome= obj.domId;
    //tukaj pustimo na začetku da se shrani tudi konfiguracija  
      Cfg.set({app: {user: obj.userId}});
      Cfg.set({app: {name: obj.name}});
      Cfg.set({app: {home: obj.domId}});  

    if (obj.uploadFanConfig){
    // uploadFanConfig=true --> NE vpiše vrednosti iz strežnika na ventilator
   // če je uploadConfig true potem objavi nazaj na konfiguracijo --> potegne podatke iz ventialtorja in jih nastavi v fansConfig pod imenom ventilatorja 
      print("uploadFanConfig=true --> NE zapisujem parametre iz serverja na modul");
      let msg = JSON.stringify({type: "fanconfig", domId: apphome, userId: appuser, nightFan: apppwmnight, groupA: apppwmgra, maxNightSpeed: appnightspeed, uploadFanConfig: false});
      print(topicpubstate, '->', msg);
      print("Objavim nazaj na server parametre iz modula");

      MQTT.pub(topicpubstate, msg, 1);

    } else {
      //tukaj pustimo na začetku da se shrani tudi konfiguracija
      Cfg.set({app: {pwm: {night: obj.nightFan}}});
      Cfg.set({app: {pwm: {gra: obj.groupA}}});
      Cfg.set({app: {night: {speed: obj.maxNightSpeed}}});
      apppwmnight = obj.nightFan;
      apppwmgra = obj.groupA;
      appnightspeed = obj.maxNightSpeed;
      print("uploadFanConfig=false --> JA zapisujem parametre iz serverja na modul in nic ne objavim nazaj");
    } 
 }
 }, null);




 MQTT.sub(topicsubcommand, function(conn, topic, msg) {
//  {"allConnected": true, “speed”: 2, “auto”: false, “boost”: false, “night”: false, “summer”: false, "boostCountDown":3600000}
  let obj = JSON.parse(msg) || {};
  
  // takoj izračunamo in postavimo hitrost ventilatorja zato, da je hiter odziv
    speed=obj.speed;

  // setSpeed();
  // PWM.set(apppin, 1000, speedpwm/100);  
 // konec takojšnje postavitve na določeno hitrost oziroma odzivnost ventilatorja

/*
  Cfg.set({app: {pwm: {val: obj.speed}}});
  Cfg.set({app: {mode: {avto: obj.auto}}});
  Cfg.set({app: {mode: {night: obj.night}}});
  Cfg.set({app: {mode: {summer: obj.summer}}});
  Cfg.set({app: {mode: {boost: obj.boost}}});
  Cfg.set({app: {boost: {time: obj.boostCountDown}}});

*/
 
  print ("allConnected: ", obj.allConnected, "Speed: ", obj.speed, "Auto ", obj.auto, "Boost ", obj.boost, "Night ", obj.night, "Summer ", obj.summer, "Countdown", obj.boostCountDown);

// pogoji načinov delovanja 
// ce je mode:summer nastavi app.pwm.time na 1 uro sicer pusti na 70s
  if (obj.summer){
    apppwmtime = 3600000;
   // Cfg.set({app: {pwm: {time: 3600000}}});
    print("Change over time set to ", apppwmtime);
  } else {
    apppwmtime = 70000;
   // Cfg.set({app: {pwm: {time: 70000}}});
    print("Change over time set to ", apppwmtime);
  };

// shrani prejšnjo hitrost preden je bil boost

  if (obj.boost){
     // postavitev hitrosti na 4 v bazi podatkov ce je izbran boost 
      appmodeboost = true;
     // oldspeed = Cfg.get('app.old.speed');
     // Cfg.set({app: {boost: {time: obj.boostCountDown}}});
      appboosttime = obj.boostCountDown;
      print ("Set oldsped: ", oldspeed, "Set countdown: ", appboosttime);

      if (speed !== 4) {
        oldspeed=speed;
        print("Oldspeed set to ", oldspeed);
        speed = 4; 
        print ("Postavi hitrost na 4 na events/fan: ", speed);
        let msg = JSON.stringify({domId: apphome, userId: appuser, boost: obj.boost, speed: speed});
        print(topicpubevents, '->', msg);
        MQTT.pub(topicpubevents, msg, 1);
      }

      SetOldSpeed();

      // one time timer to set boost to false and set back oldspeed
     // print("Deleting boostimer within if obj.boost true clause - server: ", boosttimer);
     // Timer.del(boosttimer);
     // print("Zbrisan boosttimer: ", boosttimer);
      boosttimer = Timer.set(appboosttime, false, function() {
        speedpwm = 99-oldspeed-speedpwm;
        print("Boost time ended. Setting BOOST OFF AND speed back to previous speed:", oldspeed);
        let msg = JSON.stringify({domId: apphome, userId: appuser, boost: false, speed: oldspeed});
        print(topicpubevents, '->', msg);
        MQTT.pub(topicpubevents, msg, 1);

        //boosttimer = Timer.set(appboosttime, true, function() {
          //start new periodic boosttimer
        //}, null);
        //print("Creating new boosttimer within onetimer - server: ", boosttimer);

      }, null);
      print("Kreiran nov boosttimer za one time boost OFF: ", boosttimer);

  }else{
    Timer.del(boosttimer);
    print("Deleting boostimer: ", boosttimer);
    if (appmodeboost) {
      appmodeboost=false;
      speedpwm = 99-oldspeed-speedpwm;
      print("Boost ended manually. Setting BOOST OFF AND speed back to previous speed:", oldspeed);
      let msg = JSON.stringify({domId: apphome, userId: appuser, boost: false, speed: oldspeed});
      print(topicpubevents, '->', msg);
      MQTT.pub(topicpubevents, msg, 1);
      //boosttimer = Timer.set(appboosttime, true, function() {
        //start new periodic boosttimer
      //}, null);
      //print("Creating periodic boosttimer within else obj.boost else clause - server: ", boosttimer);  
    }
    oldspeed = obj.speed;
    print("Oldspeed set to ", oldspeed);

    if (obj.night){
      if (apppwmnight){
        if (obj.speed > appnightspeed){
          speed = appnightspeed;
        }else{
          speed = obj.speed;
        }
      }else{
        speed = obj.speed;
      }
    }else{
      speed = obj.speed;
    };
  };
//konec pogojev za fan
// določitev hitrosti ventilatorja glede na groupA - A ali B ventilator

  setSpeed();
  PWM.set(apppin, 1000, speedpwm/100); 
  Timer.del(oldtimer);
 
     let msg = JSON.stringify({type: "fan", domId: apphome, userId: appuser, currentFanSpeed: speed, timeChangeDirection: apppwmtime});
     MQTT.pub(topicpubstate, msg, 1);
  // objavi in takoj postavi na novo hitrost
  print("PWM set to config speed:", speedpwm);
  print(topicpubstate, '->', msg);
 
  //starta timer ki se ponavlja z zakasnitvijo
  let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
    speedpwm = 99-speed-speedpwm;
    print("PWM set to config speed:", speedpwm);
    pwmSlowSet();   
    mqttconnectionnew = MQTT.isConnected();
    mqttReEstablished();
  }, null);
  oldtimer = newtimer;



//konec MQTT.sub
 }, null);

 // reset modula nazaj na ap ko se zbriše baza oz. dobi sporocil {"reset"=true na commands subfolder reset}
 MQTT.sub(topicsubcommandreset, function(conn, topic, msg) {
    // {"reset":true}, postavi wifi parametre in app.fcg.rst na true da bo lahko potem prvič potegnil gor konfig
    let obj = JSON.parse(msg) || {};
    print('Dobil sporocilo za reset');

    // tukaj shranimo v config ker se potem resetira modul

    Cfg.set({wifi: {sta: {enable: false}}});
    Cfg.set({wifi: {sta: {ssid: ""}}});
    Cfg.set({wifi: {sta: {pass: ""}}});
    Cfg.set({wifi: {ap: {enable: true}}});
    Cfg.set({app: {cfg: {rst: true}}});
    Sys.reboot(10000);    
  }, null);


// starts handlers for html control

  RPC.addHandler('ControlNight', function(args) {
    //shrani parameter
    //Cfg.set(args);
    appmodenight = args.app.mode.night;
    print(JSON.stringify(args));
    
    //če je povezan na strežnik mora objaviti 

        //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents
        if (MQTT.isConnected()) {  
          let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
          print(topicpubeventshtml, '->', msg);
          MQTT.pub(topicpubeventshtml, msg, 1);
        }

  });

  RPC.addHandler('ControlSummer', function(args) {
    //Cfg.set(args);
    appmodesummer = args.app.mode.summer;
    print(JSON.stringify(args));
    //če je true postavi config za time na 3600 in ponovno starta timer za hitrost
    if (appmodesummer){
      //Cfg.set({app: {pwm: {time: 3600000}}});
      apppwmtime = 3600000;
      print("Change over time set to ", apppwmtime);
    } else {
      //Cfg.set({app: {pwm: {time: 70000}}});
      apppwmtime = 70000;
      print("Change over time set to ", apppwmtime);
    };
    //speed=Cfg.get('app.pwm.val');
    setSpeed();
    print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
    PWM.set(apppin, 1000, speedpwm/100);
    //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubeventshtml
    if (MQTT.isConnected()) {  
        let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
        //let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
      print(topicpubeventshtml, '->', msg);
      MQTT.pub(topicpubeventshtml, msg, 1);
    };
    //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih, le če ni objavil, sicer se to nastavi iz strežnika
      Timer.del(oldtimer);
      let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
        speedpwm = 99-speed-speedpwm;
        print("PWM set to config speed:", speedpwm);
        pwmSlowSet();   
        mqttconnectionnew = MQTT.isConnected();
        mqttReEstablished();
      }, null);
      oldtimer = newtimer;
  //konec nastavljanja hitrosti
   
  });


  RPC.addHandler('ControlBoost', function(args) {
    //Cfg.set(args);
    print(JSON.stringify(args));
    appmodeboost = args.app.mode.boost;
   // print(JSON.stringify(args));
    //oldspeed = Cfg.get('app.old.speed');
    //če je true postavi hitrost na 4
    if (appmodeboost){
      print("Ventilator HITROST == 4 --> BOOST");
      //Cfg.set({app: {pwm: {val: 4}}});
      speed=4;
    //nastavi boost timer, da ugaoost sne oziroma prestavi nazaj na oldspeed
     // print("Deleting boostimer within if boost true clause - html: ", boosttimer);
      //Timer.del(boosttimer);
      boosttimer = Timer.set(appboosttime, false, function() {
        //onetime boosttimer
        appmodeboost=false;
        speed = oldspeed;
        //Cfg.set({app: {mode: {boost: false}}});
        //Cfg.set({app: {pwm: {val: oldspeed}}});
        // oldspeed=Cfg.get('app.old.speed');
        SetOldSpeed();
        speed=oldspeed;
        print("Boost je koncan--> boost set to: ", appmodeboost);
        print("PWM set to config speed:", speedpwm);
        PWM.set(apppin, 1000, speedpwm/100);
        print("ONETIME boosttimer elapsed - html: ", boosttimer);
     //   boosttimer = Timer.set(appboosttime, true, function() {
          //start new periodic boosttimer
     //   }, null);
     //   print("Creating new boosttimer within onetimer - html: ", boosttimer);

        
        if (MQTT.isConnected()){
          let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});   
          //let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
          print(topicpubeventshtml, '->', msg);
          MQTT.pub(topicpubeventshtml, msg, 1);
        };

      }, null);
      print ("ONE TIME BOOST TIMER CREATED - HTML: ", boosttimer);


    } else {
   //če je false postavi  hitrost na oldspeed  
      Timer.del(boosttimer);
      //delete boostimer - periodic or onetime
      print("Deleted boosttimer within else if clause - html: ", boosttimer);
      print("Ventilator HITROST == BOOST--> OLDSPEED");
      speed= oldspeed;
      //Cfg.set({app: {pwm: {val: speed}}});
      //boosttimer = Timer.set(appboosttime, true, function() {
        //start new periodic boosttimer
     // }, null);

      //print("Creating new periodic boosttimer within else if clause - html: ", boosttimer);
      
    };


    setSpeed();
    print ("Nastavitev hitrosti - speedpwm: ", speedpwm);
    print ("Nastavitev hitrosti - config: ", speed);
    PWM.set(apppin, 1000, speedpwm/100);
    //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubeventshtml
    if (MQTT.isConnected()) {  
      let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed}); 
      //let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
      print(topicpubeventshtml, '->', msg);
      MQTT.pub(topicpubeventshtml, msg, 1);
    };
    //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
      Timer.del(oldtimer);

      let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
       speedpwm = 99-speed-speedpwm;
       print("PWM set to config speed:", speedpwm);
       pwmSlowSet();   
       mqttconnectionnew = MQTT.isConnected();
       mqttReEstablished();
      }, null);
      oldtimer = newtimer;
  });

  RPC.addHandler('ControlAuto', function(args) {
    //shrani parameter
    //Cfg.set(args);
    appmodeavto = args.app.mode.avto;
    print(JSON.stringify(args));
    
    //če je povezan na strežnik mora objaviti 

        //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents
        if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed}); 
            //let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: Cfg.get('app.pwm.val')});
          print(topicpubeventshtml, '->', msg);
          MQTT.pub(topicpubeventshtml, msg, 1);
        }

  });

  RPC.addHandler('ControlSpeed', function(args) {
    //shrani in nastavi novo hitrost
    //Cfg.set(args);
    //nastavi tudi parameter old speed na isto vrednost
    //Cfg.set({app: {old: {speed: args.app.pwm.val}}});

    if (appmodeboost){
      speed=4;
      oldspeed=args.app.pwm.val;
      setSpeed();
      print ("Mastavitev hitrosti - oldspeed, po koncanem BOOST nastavitev na oldspeed: ", oldspeed);
      PWM.set(apppin, 1000, speedpwm/100);   
    } else {
      speed=args.app.pwm.val;
      oldspeed=args.app.pwm.val;
      setSpeed();
      print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
      PWM.set(apppin, 1000, speedpwm/100);  
    }

    //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents
    if (MQTT.isConnected()) {  
        let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed}); 
//       let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
      print(topicpubeventshtml, '->', msg);
      MQTT.pub(topicpubeventshtml, msg, 1);
    }
    //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
    Timer.del(oldtimer);
    let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
      speedpwm = 99-speed-speedpwm;
      print("PWM set to config speed:", speedpwm);
      pwmSlowSet();      
      mqttconnectionnew = MQTT.isConnected();
      mqttReEstablished();
    }, null);
    oldtimer = newtimer;
    //konec nastavljanja hitrosti
  });



  RPC.addHandler('ControlParam', function(args) {
    //shrani in nastavi novo hitrost
    //Cfg.set(args);
    apppwmgra = args.app.pwm.gra;
    apppwmnight = args.app.pwm.night;
  //  appnightspeed = args.app.night.speed;

    print(JSON.stringify(args));
    // če je povezan na strežnik je potrebno configuracijo poslati tudi nazaj na strežnik
    if (MQTT.isConnected()) {
      let msg = JSON.stringify({type: "fanconfig", domId: apphome, userId: appuser, nightFan: apppwmnight, groupA: apppwmgra, maxNightSpeed: appnightspeed, uploadFanConfig: false, currentFanSpeed: speed, timeChangeDirection: apppwmtime});
      print(topicpubstate, '->', msg);
      MQTT.pub(topicpubstate, msg, 1);
    }
  });

  RPC.addHandler('ControlParam1', function(args) {
    //shrani in nastavi novo hitrost
    //Cfg.set(args);
  //  apppwmgra = args.app.pwm.gra;
  //  apppwmnight = args.app.pwm.night;
    appnightspeed = args.app.night.speed;

    print(JSON.stringify(args));
    // če je povezan na strežnik je potrebno configuracijo poslati tudi nazaj na strežnik
    if (MQTT.isConnected()) {
      let msg = JSON.stringify({type: "fanconfig", domId: apphome, userId: appuser, nightFan: apppwmnight, groupA: apppwmgra, maxNightSpeed: appnightspeed, uploadFanConfig: false, currentFanSpeed: speed, timeChangeDirection: apppwmtime});
      print(topicpubstate, '->', msg);
      MQTT.pub(topicpubstate, msg, 1);
    }
  });

  RPC.addHandler('Control', function(args) {
    //shrani in nastavi novo hitrost

    Cfg.set(args);
    print(JSON.stringify(args));

  });



  RPC.addHandler('Status', function(){
    let g = apppwmgra; //Cfg.get('app.pwm.gra');
    let n = apppwmnight; //Cfg.get('app.pwm.night');
    let m = appnightspeed; //Cfg.get('app.night.speed');
    let x=true;    
    if (m===2){
      x=true;
    } else {
      x=false;
    }
    return {gra:g, night:n, maxnight:x};
  });

  RPC.addHandler('StatusModes', function(){
    let v = speed; //Cfg.get('app.pwm.val');
    let mn = appmodenight; //Cfg.get('app.mode.night');
    let ma = appmodeavto;  //Cfg.get('app.mode.avto');
    let ms = appmodesummer;  //Cfg.get('app.mode.summer');
    let mb = appmodeboost; //Cfg.get('app.mode.boost');
    return {val:v, mnight:mn, mavto:ma, msummer:ms, mboost:mb};
  });


  RPC.addHandler('Connected', function(){
    let connected = MQTT.isConnected();
    return {mqtt:connected};
  });



  GPIO.set_button_handler(pin0, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200,
    function(x) {
      print('Button press, pin: ', x);
      state0=1;
    }, null);
  
  GPIO.set_button_handler(pin1, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200,
    function(x) {
      print('Button press, pin: ', x);
      state1=1;
    }, null);
  
  GPIO.set_button_handler(pin2, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200,
    function(x) {
      print('Button press, pin: ', x); 
      state2=1;
    }, null);
  
  GPIO.set_button_handler(pin3, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200,
    function(x) {
      print('Button press, pin: ', x);
      state3=1;
    }, null);
  
  let remotetimer = Timer.set(1000, true, function() {  
   
        if (state0===0 && state1===1 && state2===0 && state3===0) {
          print("Izkljuci ventilator gre na OFF");
          //shrani in nastavi novo hitrost
          //nastavi tudi parameter old speed na isto vrednost
          //Cfg.set({app: {pwm: {val: 0}}});
          //Cfg.set({app: {old: {speed: 0}}});
          if (appmodeboost){
            speed = 4;
            oldspeed = 0;
            setSpeed();
            print ("Mastavitev hitrosti - oldspeed, po koncanem BOOST nastavitev na oldspeed: ", oldspeed);
            PWM.set(apppin, 1000, speedpwm/100);   
          } else {
           speed = 0;
           oldspeed = 0;
           setSpeed();
           print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
           PWM.set(apppin, 1000, speedpwm/100);  
          }

          //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents 
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed}); 
//          let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
           }
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
          Timer.del(oldtimer);
          let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
             speedpwm = 99-speed-speedpwm;
             print("PWM set to config speed:", speedpwm);
             pwmSlowSet();   
             mqttconnectionnew = MQTT.isConnected();
             mqttReEstablished();
          }, null);
          oldtimer = newtimer;
          //konec nastavljanja hitrosti
          setStateZero();
        };

        if (state0===0 && state1===0 && state2===1 && state3===0) {
          print("Ventilator HITROST == 1")
          //shrani in nastavi novo hitrost
          //nastavi tudi parameter old speed na isto vrednost
          //Cfg.set({app: {pwm: {val: 1}}});
          //Cfg.set({app: {old: {speed: 1}}});
          if (appmodeboost){
            speed = 4;
            oldspeed = 1;
            setSpeed();
            print ("Mastavitev hitrosti - oldspeed, po koncanem BOOST nastavitev na oldspeed: ", oldspeed);
            PWM.set(apppin, 1000, speedpwm/100);   
          } else {
           speed = 1;
           oldspeed = 1;
           setSpeed();
           print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
           PWM.set(apppin, 1000, speedpwm/100);  
          }

          //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents 
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
//            let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
           }
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
          Timer.del(oldtimer);
          let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
             speedpwm = 99-speed-speedpwm;
             print("PWM set to config speed:", speedpwm);
             pwmSlowSet();   
             mqttconnectionnew = MQTT.isConnected();
             mqttReEstablished();
          }, null);
          oldtimer = newtimer;
          //konec nastavljanja hitrosti
          setStateZero();
        };

        if (state0===1 && state1===0 && state2===1 && state3===0) {
          print("Ventilator HITROST == 2")
          //shrani in nastavi novo hitrost
          //nastavi tudi parameter old speed na isto vrednost
          //Cfg.set({app: {pwm: {val: 2}}});
          //Cfg.set({app: {old: {speed: 2}}});
          if (appmodeboost){
            speed = 4;
            oldspeed = 2;
            setSpeed();
            print ("Mastavitev hitrosti - oldspeed, po koncanem BOOST nastavitev na oldspeed: ", oldspeed);
            PWM.set(apppin, 1000, speedpwm/100);   
          } else {
           speed = 2;
           oldspeed = 2;
           setSpeed();
           print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
           PWM.set(apppin, 1000, speedpwm/100);  
          }
          //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents 
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
//            let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
           }
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
          Timer.del(oldtimer);
          let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
             speedpwm = 99-speed-speedpwm;
             print("PWM set to config speed:", speedpwm);
             pwmSlowSet();   
             mqttconnectionnew = MQTT.isConnected();
             mqttReEstablished();
          }, null);
          oldtimer = newtimer;
          //konec nastavljanja hitrosti
          setStateZero();
        };

        if (state0===0 && state1===1 && state2===1 && state3===0) {
          print("Ventilator HITROST == 3")
          //shrani in nastavi novo hitrost
          //nastavi tudi parameter old speed na isto vrednost
          //Cfg.set({app: {pwm: {val: 3}}});
          //Cfg.set({app: {old: {speed: 3}}});
          if (appmodeboost) {
            speed = 4;
            oldspeed = 3
            setSpeed();
            print ("Mastavitev hitrosti - oldspeed, po koncanem BOOST nastavitev na oldspeed: ", oldspeed);
            PWM.set(apppin, 1000, speedpwm/100);           
          } else {  
            speed = 3;
            oldspeed = 3
            setSpeed();
            print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
            PWM.set(apppin, 1000, speedpwm/100);
          }  

          //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents 
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
            //let msg = JSON.stringify({domId: Cfg.get('app.home'), userId: Cfg.get('app.user'), boost: Cfg.get('app.mode.boost'), auto: Cfg.get('app.mode.avto'), summer: Cfg.get('app.mode.summer'), night: Cfg.get('app.mode.night'), speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
           }
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
          Timer.del(oldtimer);
          let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
             speedpwm = 99-speed-speedpwm;
             print("PWM set to config speed:", speedpwm);
             pwmSlowSet();   
             mqttconnectionnew = MQTT.isConnected();
             mqttReEstablished();
          }, null);
          oldtimer = newtimer;
          //konec nastavljanja hitrosti
          setStateZero();
        };


        if (state0===0 && state1===1 && state2===1 && state3===1) {
          print("Pritisnil gumb BOOST na daljincu")
          // potrebno nastaviti BOOST kot v html
          if (appmodeboost){
            appmodeboost = false;
            Timer.del(boosttimer);
            //Cfg.set({app: {mode: {boost: false}}});
            print("DELETE boosttimer if clause true - remote: ", boosttimer);
            print("BOOST gre na OFF in HITROST == BOOST--> OLDSPEED");
            speed = oldspeed;
            //Cfg.set({app: {pwm: {val: speed}}});

            //boosttimer = Timer.set(appboosttime, true, function() {
              //start new periodic boosttimer
            //}, null);
            //print("Creating new periodic boostimer within if clause true - remote: ", boosttimer);
          //konec nastavljanja hitrosti            

          }  else {
            print("Ventilator HITROST == 4 --> BOOST");
            //nastavi hitrost 4
            appmodeboost = true;
            //Cfg.set({app: {mode: {boost: true}}});
            //Cfg.set({app: {pwm: {val: 4}}});
            speed=4;
          //konec nastavljanja hitrosti
            //nastavi boost timer, da ugasne oziroma prestavi nazaj na oldspeed
           // Timer.del(boosttimer);
            boosttimer = Timer.set(appboosttime, false, function() {
              appmodeboost = false;

              //Cfg.set({app: {mode: {boost: false}}});
              //Cfg.set({app: {pwm: {val: oldspeed}}});
              //oldspeed=Cfg.get('app.old.speed');
              SetOldSpeed();
              speed=oldspeed;
              print("Boost je koncan--> boost set to: ", appmodeboost);
              print("PWM set to config speed:", speedpwm);
              PWM.set(apppin, 1000, speedpwm/100);
              print("ONETIME boostimer elapsed - remote: ", boosttimer);
             // boosttimer = Timer.set(appboosttime, true, function() {
                //start new periodic boosttimer
             // }, null);
             // print("Creating new boostimer within onetimer - remote: ", boosttimer);
              
              if (MQTT.isConnected()){
                let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
                print(topicpubeventshtml, '->', msg);
                MQTT.pub(topicpubeventshtml, msg, 1);
              };
            }, null);
            print("Creating new ONETIME boostimer - remote: ", boosttimer);

          }

          setSpeed();
          print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
          print ("Nastavitev hitrosti - config: ", speed);
          PWM.set(apppin, 1000, speedpwm/100);
    
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
          };
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih
          Timer.del(oldtimer);
          let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
            speedpwm = 99-speed-speedpwm;
            print("PWM set to config speed:", speedpwm);
            pwmSlowSet();   
            mqttconnectionnew = MQTT.isConnected();
            mqttReEstablished();
          }, null);
          oldtimer = newtimer;

          //konec nastavitve boost
          setStateZero();
        };
  




        if (state0===0 && state1===1 && state2===0 && state3===1) {
          print("NOČNI NAČIN")
          // potrebno nastvaiti nočni kot v html
          if (appmodenight){
            appmodenight = false;
            //Cfg.set({app: {mode: {night: false}}});
          } else {
            appmodenight = true;
            //Cfg.set({app: {mode: {night: true}}});
          }
          print("Night mode set to: ", appmodenight);

          //če je povezan na strežnik mora objaviti 
      
              //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents
              if (MQTT.isConnected()) {  
                let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
                print(topicpubeventshtml, '->', msg);
                MQTT.pub(topicpubeventshtml, msg, 1);
              }
          // konec nastavitve night mode
          setStateZero();
        };
  
  
        if (state0===1 && state1===1 && state2===0 && state3===1) {
          print("AUTO NAČIN")
          // potrebno nastvaiti AUTO kot v html
          if (appmodeavto){
            appmodeavto = false;
            //Cfg.set({app: {mode: {avto: false}}});
          } else {
            appmodeavto = true;
            //Cfg.set({app: {mode: {avto: true}}});
          }
          print("Auto mode set to: ", appmodeavto);
          //če je povezan na strežnik mora objaviti 
              //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubevents
              if (MQTT.isConnected()) {  
                let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
                print(topicpubeventshtml, '->', msg);
                MQTT.pub(topicpubeventshtml, msg, 1);
              }
          // konec nastavitve AUTO
          setStateZero();
        };
  
  
        if (state0===1 && state1===0 && state2===1 && state3===1) {
          print("POLETNI NAČIN")
          // potrebno nastvaiti POLETNI kot v html
          if (appmodesummer){
            appmodesummer = false;
            apppwmtime = 700000;
            //Cfg.set({app: {mode: {summer: false}}});
            //Cfg.set({app: {pwm: {time: 70000}}});
          } else {
            appmodesummer = true;
            apppwmtime = 36000000;
            //Cfg.set({app: {mode: {summer: true}}});
            //Cfg.set({app: {pwm: {time: 3600000}}});
          }
          
          print("Summer mode set to: ", appmodesummer);
          print("Change over time set to ", apppwmtime);
          //speed=Cfg.get('app.pwm.val');
          setSpeed();
          print ("Mastavitev hitrosti - speedpwm: ", speedpwm);
          PWM.set(apppin, 1000, speedpwm/100);
          //objavi na strežnik le če je MQTT povezan --> mora objaviti pod user in ne pod ventilator, da se potem vsi sinhronizirajo -> torej na topicpubeventshtml
          if (MQTT.isConnected()) {  
            let msg = JSON.stringify({domId: apphome, userId: appuser, boost: appmodeboost, auto: appmodeavto, summer: appmodesummer, night: appmodenight, speed: speed});
            print(topicpubeventshtml, '->', msg);
            MQTT.pub(topicpubeventshtml, msg, 1);
          };
          //zbriše prejšnji in starta nov timer, ki se ponavlja z zakasnitvijo kot nastavljeno v parametrih, le če ni objavil, sicer se to nastavi iz strežnika
            Timer.del(oldtimer);
            let newtimer = Timer.set(apppwmtime, Timer.REPEAT, function() {
              speedpwm = 99-speed-speedpwm;
              print("PWM set to config speed:", speedpwm);
              pwmSlowSet();   
              mqttconnectionnew = MQTT.isConnected();
              mqttReEstablished();
            }, null);
            oldtimer = newtimer;
        //konec nastavljanja hitrosti  
          // konect nastavitev POLETNI kot v html
          setStateZero();
        };
      }, null);
  
  