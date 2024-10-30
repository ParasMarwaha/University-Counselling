const express = require('express');
const app = express();
const admincontroller = require('./controllers/AdminController');
app.use(express.static('public'));
const {verify} = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const connection = require("./connection");
const usercontroller = require('./controllers/usercontroller');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(cookieParser());
app.use(fileupload({}))
app.use(express.urlencoded({ extended: true }));

function AdminAuthorization(req,res,next){
    if (req.cookies.adminToken === "undefined") {
        return res.json({error:'Unauthorized Access'});
    }

    let token = req.cookies.adminToken
    let secret = "abc@123"

    try {
        req['adminInfo'] = verify(token, secret)
        // console.log(req['customerInfo'])
        next()
    } catch (error) {
        res.redirect('/admin')
    }
}

function AdminAuthorization_Get(req,res,next){
    if (!req.cookies.adminToken ) {
        res.redirect('/admin')
    }
    else {
        let token = req.cookies.adminToken
        let secret = "abc@123"

        try {
            req['adminInfo'] = verify(token, secret)
            // console.log(req['customerInfo'])
            next()
        } catch (error) {
            res.redirect('/admin')
        }
    }
}

function StudentAuthorization_Get(req,res,next){
    if (req.cookies.userToken === "undefined" ) {
        //console.log(req.cookies.userToken)
        res.redirect('/login-user')
    }
    else {
        let token = req.cookies.userToken
        let secret = "abc@123"

        try {
            req['userInfo'] = verify(token, secret)
            // console.log(req['customerInfo'])
            next()
        } catch (error) {
            res.redirect('/login-user')
        }
    }
}


app.get('/', (req, res) => {
    res.render('User/index');
})

app.get('/admin', (req, res) => {
    res.render('Admin/Login');
})

app.get('/admin-dashboard', (req, res) => {
    res.render('Admin/AdminDashboard');
})

app.get('/admin-forgot', (req, res) => {
    res.render('Admin/AdminForgot');
})

app.get('/admin-logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/admin')
})
app.get('/admin-otp/:email', (req, res) => {
    res.render('Admin/AdminOTP' ,{email: req.params});
})

app.get("/admin-newpass/:email", (req, res) => {
    res.render('Admin/AdminOTPpass',{email: req.params});
})

app.get("/admin-user",AdminAuthorization_Get, (req, res) => {
    res.render('Admin/AdminUsers',{email: req.params});
})

app.get("/admin-course",AdminAuthorization_Get, (req, res) => {
    res.render('Admin/Course',{email: req.params});
})

app.get("/admission",(req,res)=>{
    res.render('User/AdmissionInstructions')
})

app.get("/admission-form",(req,res)=>{
    res.render('User/Admission')
})

app.get("/login-user",(req,res)=>{
    res.render('User/UserLogin')
})

app.get('/user-logout', (req, res) => {
    res.clearCookie('userToken');
    res.redirect('/login-user')
})

app.get("/user-dashboard",StudentAuthorization_Get,(req,res)=>{
   // console.log(req['userInfo'])
    let {id} = req['userInfo']
    let get = `select * from admission where id = ${id}`;
    connection.query(get,(error,result)=>{
        if (error) {
            res.json({error: error.message})
        }
        else if(result[0].degName ==="Under Graduation") {
            // console.log(record[0].counselling_fee)
                    res.render('User/UserDashboard', {lockStatus:result[0].lockStatus,degName:result[0].degName,counselling_fee: 2000, name: result[0].full_name, father: result[0].father_name , counselling_fees_status : result[0].counselling_fee_status});
        }
        else{
            // console.log(record[0].counselling_fee)
            res.render('User/UserDashboard', {lockStatus:result[0].lockStatus,degName:result[0].degName,counselling_fee: 2500, name: result[0].full_name, father: result[0].father_name , counselling_fees_status : result[0].counselling_fee_status});
        }
    })
    })

app.get('/profile',(req,res)=>{
    res.render('User/Profile')
})


app.get('/user-forgot',(req,res)=>{
    res.render('User/UserForgetPassword')
})

app.get('/user-changePassword',(req,res)=>{
    res.render('User/User-Change-password')
})

app.get('/userChangeForgotPassword',(req,res)=>{
    res.render('User/userChangeForgotPassword')
})

app.get('/user-pending',(req,res)=>{
    res.render('Admin/Pending')
})

app.get('/user-confirmed',(req,res)=>{
    res.render('Admin/Confirmed')
})

app.get('/admin-seat-allotment',AdminAuthorization,(req,res)=>{
    res.render('Admin/SeatAlotment')
})

app.get('/seat-alloted',AdminAuthorization,(req,res)=>{
    res.render('Admin/SeatAlloted')
})

app.get('/read-student',admincontroller.ReadStudent)

app.get('/read-student-confirm',admincontroller.ReadStudentConfirm)

app.get('/allotted',admincontroller.Alloted)

app.get('/get-course-name/:id',admincontroller.ReadCourseName)

app.get('/getcourses/:degName',usercontroller.GetCoursesName)

app.get('/read-profile',StudentAuthorization_Get,usercontroller.ReadProfile)


app.post('/getcourses',admincontroller.GetCourses)

app.post('/Allotted-seat-search',admincontroller.Allotted)

app.post('/submit',usercontroller.Form)

app.post('/update-profile',StudentAuthorization_Get,usercontroller.Update)

app.post("/userChangeForgotPassword",usercontroller.UserChangeForgotPassword)

app.post('/user-login',usercontroller.LoginForm)

app.post('/userForgotPassword',usercontroller.UserForgotPassword)

app.post('/seat-search',admincontroller.SeatSearch)

app.post("/userVerifyOtp",usercontroller.UserVerifyOtp)

app.post('/update_personal_info',admincontroller.UpdatePersonalInfo)

app.post('/change-password',StudentAuthorization_Get,usercontroller.ChangePassword)

app.get('/read-user',admincontroller.ReadUser)

app.post('/allot-seat/:student_id',AdminAuthorization,admincontroller.AllotSeat)

app.get('/student-paid/:fee',StudentAuthorization_Get,usercontroller.StudentPayment)

app.get('/delete-course/:id',admincontroller.DeleteCourse)

app.get('/inactive/:id',admincontroller.Inactive)

app.get('/send-email/:student_id',admincontroller.SendEmail)

app.get('/get-payment-info/:student_id',admincontroller.GetPaymentInfo)

app.get('/read-student-payment/:student_id',admincontroller.GetPay)

app.post('/pay-fee',admincontroller.PayFee)

app.post('/pay-fee-online',admincontroller.PayFeeOnline)

app.get('/active/:id',admincontroller.Active)

app.get('/read-course',admincontroller.ReadCourse)

app.get('/check-pref',StudentAuthorization_Get,usercontroller.CheckPref)

app.get('/read-courses',StudentAuthorization_Get,usercontroller.ReadCourse)

app.get('/read-seat/:id',admincontroller.ReadSeat)

app.get('/checkData',StudentAuthorization_Get,usercontroller.CheckData)

app.get('/lock-dash',StudentAuthorization_Get,usercontroller.LockDash)

app.post('/admin-forgot-pass',admincontroller.SendAdminOTP)

app.post('/admin-otp/:email',admincontroller.VerifyAdminOTP)

app.post('/change-adminotp-password/:email',admincontroller.ChangeAdminOTPPassword)

app.post('/add-admin',admincontroller.AddAdmin)

app.post('/add-admin-course',admincontroller.AddCourse)

app.post('/add-course',StudentAuthorization_Get,usercontroller.AddCourse)

app.post('/add-admin-seats',admincontroller.AddSeats)

app.post('/login',admincontroller.AdminLogin)

app.post('/update-course',admincontroller.UpdateCourse)

app.post('/update-seat',admincontroller.UpdateSeat)

app.post('/update_address/:id',admincontroller.UpdateAddress)

app.post('/update_degree',admincontroller.UpdateDegree)

app.post('/update_photo',admincontroller.UpdatePhoto)

app.post('/update_signature',admincontroller.UpdateSignature)

app.post('/add-marks3',StudentAuthorization_Get,usercontroller.AddPostMarks)

app.post('/add-marks1',StudentAuthorization_Get,usercontroller.AddMarksPCM)

app.post('/add-marks2',StudentAuthorization_Get,usercontroller.AddMarksNoPCM)












app.listen(3000,(error)=>{
    if(error){
        console.log(error)
    }else{
        console.log("server is running at 3000")
    }
})