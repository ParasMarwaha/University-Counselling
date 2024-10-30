const express = require('express');

const router = express.Router();
const connection = require("../connection");
const cookieParser = require("cookie-parser");
const {sign} = require('jsonwebtoken');
const nodemailer = require("nodemailer");

function StudentPayment(req, res) {
   // console.log(req['userInfo'])
   // console.log(req.params)
    let {id} = req['userInfo'];
    let {fee} = req.params
    let pay = `Update admission set counselling_fee_status = 'PAID', payment_date =CURDATE(),counselling_fee = ${fee} where id = ${id}`
    connection.query(pay,(error) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error: '', message:'Paid successfully.'})
        }
    })
}

async function Form(req,res){
     // console.log(req.body)
    //  console.log(req.files.photo.name)
    //  console.log(req.files.signature.name)
    if(!req.body.caste){
        res.json({error: "Please Select Caste"})
    }else{

        const password = Math.floor(100000 + Math.random() * 900000);

        let{degName,name,fathername,mothername,punjab_outside,caste,aadhaar,dob,gender,mobile,email,address_permanent,district,state,guardian_mobile,guardian_email,hosteller} = req.body;
        let{photo,signature} = req.files


        let photoServerPath = `public/form-img/photo/${photo.name}`
        let signatureServerPath = `public/form-img/signature/${signature.name}`
        let photoDBPath = `/form-img/photo/${photo.name}`
        let signatureDBPath = `/form-img/signature/${signature.name}`


        photo.mv(photoServerPath,(error)=>{
            if(error){
                res.json({error: error.message})
            }
            else{
                signature.mv(signatureServerPath,(error)=>{
                    if(error){
                        res.json({error: error.message})
                    }
                    else{
                        let submit = `INSERT INTO admission (degName,full_name,father_name,mother_name,photo,signature,residence,caste,aadhaar,dob,gender,phone,address,email,password,district,state,gardian_no,gardian_email,hostel) VALUES
                         ('${degName}','${name}','${fathername}','${mothername}','${photoDBPath}','${signatureDBPath}','${punjab_outside}','${caste}','${aadhaar}','${dob}','${gender}','${mobile}','${address_permanent}','${email}','${password}','${district}','${state}','${guardian_mobile}','${guardian_email}','${hosteller}')` ;
                        // console.log(submit)
                        connection.query(submit,(error)=>{
                            if (error){
                                res.json({error: error.message})
                            }
                            else
                            {
                                const transporter = nodemailer.createTransport({
                                    host: 'smtp.gmail.com',
                                    port: 587,
                                    secure: false, // or 'STARTTLS'
                                    auth: {
                                        user: 'parasmarwaha246@gmail.com',
                                        pass: 'auxq kiup dcan wlzi'
                                    }
                                });

                                const mailOptions = {
                                    from: 'parasmarwaha246@gmail.com',
                                    to: email,
                                    subject: 'Your Login Information',
                                    text: `Your email is : ${email} And
                                    Your password is: ${password}`
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        res.json({error: 'Failed to send password', message: ''});
                                    }
                                    // console.log('OTP sent to', email);
                                    res.json({error: '', message: 'Admission Form Submitted Successfully. '});
                                });
                            }
                        })
                    }
                })
            }
        })

    }
}

async function LoginForm(req,res){
    //console.log(req.body)
    let {email, password}= req.body

    if(email === '' || password=== ''){
        res.json({error:'ALL FIELDS ARE REQUIRED', message:''})
    }else{
        // Authentication
        let checkUser= `SELECT * FROM admission WHERE email = '${email}' and password = '${password}'`
        //console.log(checkUser)
        connection.query(checkUser,(error,record)=>{
            if(error){
                res.json({error: error.message, message :''})
            }else{
                // console.log(record.length)
                if(record.length === 0){
                    res.json({error:"Invalid Email or Password", message: ''})
                }

                else{
                    //     // console.log(record)
                    let payload = {
                        id : record[0].id,
                        email: record[0].email,
                        name :record[0].full_name
                    }
                    let secret = "abc@123"
                    let expiry = 120 * 60

                    let token = sign(payload,secret,{expiresIn:expiry})
                    //console.log(token)

                    res.cookie('userToken',token,
                        {expires : new Date (Date.now() + expiry  * 1000)})

                    res.json({error: '', message :'Login Success'})
                }

            }

        })

    }
}

function UserForgotPassword(req, res) {
    {
        const {email} = req.body
        const OTP = Math.floor(100000 + Math.random() * 900000);
        let insertQuery = `select * from admission where email='${email}'`;
        connection.query(insertQuery, (error, record) => {
            if (error) {
                res.json({error: error.message, message: ''});
            } else {
                if (record.length === 0) {
                    res.json({error: 'Email does not Exist', message: ''});
                } else {
                    let updateQuery = `update admission set otp='${OTP}' where email='${email}'`;
                    connection.query(updateQuery, (error) => {
                        if (error) {
                            res.json({error: error.message, message: ''});
                        } else {
                            const transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 587,
                                secure: false, // or 'STARTTLS'
                                auth: {
                                    user: 'parasmarwaha246@gmail.com',
                                    pass: 'auxq kiup dcan wlzi'
                                }
                            });

                            const mailOptions = {
                                from: 'parasmarwaha246@gmail.com',
                                to: email,
                                subject: 'OTP for Password Reset',
                                text: `Your OTP is: ${OTP}`
                            };
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    res.json({error: 'Failed to send OTP', message: ''});
                                }

                                // console.log('OTP sent to', email);
                                res.json({error: '', message: 'An OTP has been sent to given Email Address'});
                            });
                        }
                    })
                }
            }
        })
    }
}

function UserVerifyOtp(req, res) {
    const {email, otp} = req.body
    let selectQuery = `select * from admission where email='${email}'`;
    connection.query(selectQuery, (error, record) => {
        if (error) {
            res.json({error: error.message, message: ''});
        } else {
            if (record[0].otp !== otp) {

                res.json({error: 'OTP does not Matched', message: ''});
            } else {

                let nullQuery = `update admission set otp=NULL`;
                connection.query(nullQuery, (error) => {
                    if (error) {
                        res.json({error: error.message, message: ''})
                    } else {
                        res.json({error: '', message: 'OTP Matched'})
                    }
                })
            }
        }
    })
}

function UserChangeForgotPassword(req, res) {
    // console.log(req.body)
    const {newPassword, email} = req.body
    let updateQuery = `update admission set password='${newPassword}' where email='${email}'`;
    connection.query(updateQuery, (error) => {
        if (error) {
            res.json({error: error.message, message: ''});
        } else {
            res.json({error: '', message: 'Password Changed Successfully'})
        }
    })
}

async function GetCoursesName(req,res){
    // console.log(req.params)
    let{degName} = req.params;
    let get = `SELECT * FROM courses WHERE degree = '${degName}'`;
    connection.query(get, (error,records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error:'',records:records})
        }
    })
}

async function ChangePassword(req,res) {
    //console.log(req.body)
    let {id} = req['userInfo']
    //console.log(req['customerInfo'])
    let {current, newpass, confirm} = req.body;

    if (!current || !newpass || !confirm) {
        res.json({error: 'All fields are required'});
    } else if (newpass !== confirm) {
        res.json({error: 'New password and confirm password do not match'});
    } else {
        const query = `SELECT password FROM admission WHERE id = ${id}`;
        //console.log(query)
        connection.query(query, (error, results) => {
            //console.log(results)
            if (error) {
               // console.log('error')
                res.json({error: 'Error fetching current password',message:''});
            } else if (results[0].password !== current) {
               // console.log('error2')
                res.json({error: 'Incorrect current Password',message:''});
            }else {
                const update = `UPDATE admission SET password =${newpass} WHERE id = ${id}`;
                connection.query(update, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        res.json({error:'',message:'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function AddCourse(req,res){
   // console.log(req.body)
   // console.log(req['userInfo'])
    let {id} = req['userInfo']
    let {course_id} = req.body;

    let check= `select * from preference where student_id=${id} AND courses_id=${course_id}`;
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else if(results.length>0){
            res.json({error:'Course Already Added',message:''});
        }
        else{
            let check2 = `SELECT * FROM preference WHERE student_id = ${id} ORDER BY order_no DESC;`;
            //console.log(check2)
            connection.query(check2, (error, record) => {
                // console.log(results.length)
                if(error){
                    res.json({error: error.message})
                }
                else if(record.length>=4){
                    //console.log(record.length)
                    res.json({error:'Only can add upto 4 courses',message:''});
                }
                else if(record.length===0){
                    let add = `insert into preference (student_id,courses_id,order_no) values ('${id}','${course_id}',1)`
                    //console.log(add)
                    connection.query(add, (error) => {
                        if (error) {
                            res.json({error: error.message})
                        }
                        else{
                            res.json({error:'',message:'Course Added successfully.'})
                        }
                    })
                }
                else{
                    let order = record[0].order_no;
                    //console.log(order)
                    if(order >= 1){
                        let add = `insert into preference (student_id,courses_id,order_no) values ('${id}','${course_id}',${order} + 1)`
                        //console.log(add)
                        connection.query(add, (error) => {
                            if (error) {
                                res.json({error: error.message})
                            }
                            else{
                                res.json({error:'',message:'Course Added successfully.'})
                            }
                        })
                    }

                }
            })

        }
    })

}

async function ReadCourse(req,res){
    let {id} = req['userInfo']
    let get = `SELECT * FROM preference INNER JOIN courses ON preference.courses_id = courses.id where student_id=${id}` ;
    connection.query(get, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error:'',records:results})
        }
    })

}

async function CheckPref(req,res){
    let {id} = req['userInfo']
    let check = `SELECT * FROM preference INNER JOIN courses ON preference.courses_id = courses.id where student_id=${id}` ;
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else if(results.length===0){
            res.json({error:'Please Select Preference First',message:''})
        }else{
            res.json({error:'',records:results})
        }
    })
}

async function AddPostMarks(req,res) {
    let {id} = req['userInfo']
    //console.log(id)
    //console.log(req.body)

    let check = `select * from marks where student_id=${id}`;
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        } else if (results.length > 0) {
            res.json({error: 'Marks Already Uploaded .'})
        }
        else {
            let {uni, rollNumber, collegeMaxMarks, collegeObtMarks} = req.body;
            let insert = `INSERT INTO marks (student_id,roll_number,university_college,college_max_marks,college_obtained_marks) VALUES 
                                           ('${id}','${rollNumber}','${uni}','${collegeMaxMarks}','${collegeObtMarks}')`
            // console.log(insert)
            connection.query(insert, (error, results) => {
                if (error) {
                    res.json({error: error.message})
                } else {
                    res.json({error: '', message: 'Marks Uploaded successfully.'})
                }
            })
        }
    })
}

async function AddMarksPCM(req,res){
    let {id} = req['userInfo']
   // console.log(id)
   // console.log(req.body)

    let check = `select * from marks where student_id=${id}` ;
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else if(results.length>0){
            res.json({error:'Marks Already Uploaded .'})
        }
        else {
            let{subject1,subject2,subject3, board, rollNumber, maxMarks1, obtainedMarks1, maxMarks2, obtainedMarks2, maxMarks3, obtainedMarks3, subject4, maxMarks4, obtainedMarks4, subject5, maxMarks5, obtainedMarks5} = req.body;

            let insert = `INSERT INTO marks (student_id,sub1,sub2,sub3,sub4,sub5,ob_marks1,ob_marks2,ob_marks3,ob_marks4,ob_marks5,max_marks1,max_marks2,max_marks3,max_marks4,max_marks5,board,roll_number) VALUES
    ('${id}','${subject1}','${subject2}','${subject3}','${subject4}','${subject5}','${obtainedMarks1}','${obtainedMarks2}','${obtainedMarks3}','${obtainedMarks4}','${obtainedMarks5}','${maxMarks1}','${maxMarks2}','${maxMarks3}','${maxMarks4}','${maxMarks5}','${board}','${rollNumber}')`

            //console.log(insert)
            connection.query(insert, (error, results) => {
                if (error) {
                    res.json({error: error.message})
                }
                else{
                    res.json({error:'',message:'Marks Uploaded successfully.'})
                }
            })
        }
    })

}

async function AddMarksNoPCM(req,res){
    let {id} = req['userInfo']
    //console.log(id)
    //console.log(req.body)


    let{subject12,subject22,subject32, board2, rollNumber2, maxMarks12, obtainedMarks12, maxMarks22, obtainedMarks22, maxMarks32, obtainedMarks32, subject42, maxMarks42, obtainedMarks42, subject52, maxMarks52, obtainedMarks52} = req.body;

    let insert = `INSERT INTO marks (student_id,sub1,sub2,sub3,sub4,sub5,ob_marks1,ob_marks2,ob_marks3,ob_marks4,ob_marks5,max_marks1,max_marks2,max_marks3,max_marks4,max_marks5,board,roll_number) VALUES
    ('${id}','${subject12}','${subject22}','${subject32}','${subject42}','${subject52}','${obtainedMarks12}','${obtainedMarks22}','${obtainedMarks32}','${obtainedMarks42}','${obtainedMarks52}','${maxMarks12}','${maxMarks22}','${maxMarks32}','${maxMarks42}','${maxMarks52}','${board2}','${rollNumber2}')`

    //console.log(insert)

    connection.query(insert, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error:'',message:'Marks Uploaded successfully.'})
        }
    })
}

function CheckData(req,res){
    let {id} = req['userInfo']
   // console.log(id)
    let get = `SELECT * FROM marks WHERE student_id= ${id}`;
    connection.query(get, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else if(results.length === 0){
            res.json({error:'',message:'EMPTY'})
        }
        else{
            res.json({error:'',results:results})
        }
    })
}

function LockDash(req,res) {

    let {id} = req['userInfo']
   // console.log(id)

    let get = `SELECT * FROM preference WHERE student_id= ${id}`;
    connection.query(get, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else if(results.length === 0){
            res.json({error:'Choose a preference first',message:''})
        }
        else {
            let get = `SELECT * FROM marks WHERE student_id= ${id}`;
            connection.query(get, (error, results) => {
                if (error) {
                    res.json({error: error.message})
                }
                else if(results.length === 0){
                    res.json({error:'Submit your marks first',message:''})
                }
                else{
                    let insert = `update admission set lockStatus = 'Locked',lockDate = curdate() where id = ${id}`;
                   // console.log(insert)
                    connection.query(insert,(error, results) => {
                        if (error) {
                            res.json({error: error.message})
                        }
                        else {
                            res.json({error:'',message:'Dashboard Locked'})
                        }
                    })
                }
            })
        }

    })
}

function ReadProfile(req,res){
    let{id} = req['userInfo']
    let insert = `select * from admission where id = ${id}`
    connection.query(insert, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error:'',records:results})
        }
    })
}

function Update(req,res){
    let {id} = req['userInfo']
    console.log(req.body)
    let{name,fathername,email,mothername,dob,mobile,aadhaar,gender,guardian_email,guardian_mobile,district,state,address_permanent}=req.body;
    let update = `update admission set full_name='${name}',father_name='${fathername}',mother_name ='${mothername}',email='${email}',dob='${dob}',phone='${mobile}',
 aadhaar='${aadhaar}',gender='${gender}',gardian_no ='${guardian_mobile}',gardian_email ='${guardian_email}',district='${district}',state='${state}',address='${address_permanent}' where id = ${id}`;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Profile Updated successfully.'});
        }
    })
}


module.exports = {
    StudentPayment,
    UserVerifyOtp,
    UserForgotPassword,
    UserChangeForgotPassword,
    LoginForm,
    Form,
    GetCoursesName,
    ChangePassword,
    AddCourse,
    ReadCourse,
    CheckPref,
    AddPostMarks,
    AddMarksPCM,
    AddMarksNoPCM,
    CheckData,
    LockDash,
    ReadProfile,
    Update
};