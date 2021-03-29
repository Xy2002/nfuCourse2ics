const request = require('request');
const ics = require('ics')
const fs = require('fs')

async function main(item) {

    function randomString(t) {
        t = t || 32;
        for (var e = "oOLlABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789.", n = e.length, l = "", i = 0; i < t; i++)
            l += e.charAt(Math.floor(Math.random() * n));
        return l
    }

    function jwLogin(username, password) {
        let l = randomString(10)
        let options = {
            'method': 'POST',
            'url': 'http://ecampus.nfu.edu.cn:2929/jw-privilegei/User/r-login',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'username': username,
                'password': password,
                'rd': l
            }
        };
        return new Promise((resolve) => {
                request(options, function (error, response) {
                    if (error) throw new Error(error);
                    resolve(JSON.parse(response.body).msg)
                })
            }
        )
    }

    let token = await jwLogin(item.username, item.password)

    function SpiderCourseData(xn, xq, token) {
        let options = {
            'method': 'POST',
            'url': 'http://ecampus.nfu.edu.cn:2929/jw-cssi/CssStudent/r-listJxbForIndex',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'SESSION=MDBkMWI2ODYtMzM4ZC00YjNiLTg5ODEtN2VjMGJhZjhjNDhi'
            },
            form: {
                'xn': xn,
                'xq': xq,
                'jwloginToken': token
            }
        };
        return new Promise((resolve) => {
            request(options, function (error, response) {
                if (error) throw new Error(error);
                let courseData = JSON.parse(response.body)
                resolve(courseData.msg)
            })
        })
    }

    let courseData = await SpiderCourseData(item.xn, item.xq, token)

    function courseData2isc(item, courseData) {
        var result = [];
        var alarms = [{
            action: 'display', trigger: {minutes: 30, before: true}
        }]
        for (var i in courseData) {
            var startDate = new Date(courseData[i].start)
            var endDate = new Date(courseData[i].end)
            var start = [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds()]
            var end = [endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), endDate.getHours(), endDate.getMinutes(), endDate.getSeconds()]
            var title = courseData[i].title;
            var location = courseData[i].place
            var description = courseData[i].title + "课程将于" + startDate.getHours() + "时" + startDate.getMinutes() + "分" + "即将在" + courseData[i].place + "上课，请在上课前到达"
            result.push({
                start: start,
                end: end,
                title: title,
                description: description,
                location: location,
                alarms: alarms
            })
        }
        ics.createEvents(result, (error, value) => {
            if (error) {
                console.log(error)
            }
            fs.writeFileSync(`${item.username}-${item.xn}年-第${item.xq}学期.ics`, value)
        })

    }

    courseData2isc(item, courseData)
}

let stu = {
    username: '',
    password: '',
    xn: '',
    xq: ''
}
main(stu)
