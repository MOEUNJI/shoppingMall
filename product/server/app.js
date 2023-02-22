const { request } = require("express");
const express = require("express");
const app = express();
const session = require("express-session");
const fs = require("fs");

app.use(
    session({
        secret: "secret code", //세션에 대한 키 (생성하고 싶은 키에 대한 문자열을 넣으면 됨)
        resave: false, // 세션의 수정사항이 생기지 않더라도 세션을 다시 저장하냐는 설정 (필요 없어서 false)
        saveUninitialized: false, // 세션에 저장한 내역이 없더라도 세션을 항상 재저장을 할거냐는 설정
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60, //쿠키 유효시간 1시간
        },
    })
);

const server = app.listen(3000, () => {
    console.log("Server Started. port 3000.");
});

let sql = require("./sql");
fs.watchFile(__dirname + "/sql.js", (curr, prev) => {
    console.log("sql변경시 재시작 ㄴㄴ");
    delete require.cache[require.resolve("./sql.js")];
    sql = require("./sql.js");
});

// DB연결하는 부분 정의
const db = {
    database: "dev",
    connectionLimit: 10,
    host: "127.0.0.1",
    user: "root",
    password: "mariadb",
};

const dbPool = require("mysql").createPool(db);

// 뷰 기반으로 클라이언트를 만들 때 클라이언트에서 웹서버쪽으로 엑시오스를 이용해서 get이나post를 날릴 수 있는데 그 때 post방식으로 데이터 요청이 들어왔을 때 타는 주소
app.post("/api/login", async (request, res) => {
    request.session["email"] = "ejn5004@naver.com";
    res.send("ok");
});
app.post("/api/logout", async (request, res) => {
    request.session.destroy();
    res.send("ok");
});

app.post("/apirole/:alias", async (request, res) => {
    if (!request.session.email) {
        return res.status(401).send({ error: "You need to login." });
    }

    try {
        res.send(await req.db(request.params.alias));
    } catch (err) {
        res.status(500).send({
            error: err,
        });
    }
});
// /:alias = 사용자가 /login or /logout 이 아닌 다른 포트로 들어왔을 경우 경로를 지정해주는 것

app.post("/api/:alias", async (request, res) => {
    try {
        res.send(await req.db(request.params.alias));
    } catch (err) {
        res.status(500).send({
            error: err,
        });
    }
});

const req = {
    async db(alias, param = [], where = "") {
        return new Promise((resolve, reject) =>
            dbPool.query(sql[alias].query + where, param, (error, rows) => {
                if (error) {
                    if (error.code != "ER_DUP_ENTRY") console.log(error);
                    resolve({
                        error,
                    });
                } else resolve(rows);
            })
        );
    },
};
