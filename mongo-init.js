db.createUser(
    {
        user: "ash",
        pwd: "ash9900",
        roles: [
            {
                role: "readWrite",
                db: "flask_db"
            }
        ]
    }
);