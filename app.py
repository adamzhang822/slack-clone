from flask import Flask, request, make_response, jsonify, g
import configparser
import string
import random
import sqlite3
import bcrypt


# -------------------------------- Set Up ----------------------------------

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Bcrypt secret and authentication: 
config = configparser.ConfigParser()
config.read('secrets.cfg')
PEPPER = config['secrets']['PEPPER']
session_tokens = {}
def new_token():
    token = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    return token


# Database setup: 
DATABASE = 'belay.db'
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def update_db(query, args=()):
    cur = get_db().execute(query, args)
    get_db().commit()
    cur.close()

# -------------------------------- Landing page ----------------------------------


@app.route('/')
def index(channel_id=None, message_id=None):
    return app.send_static_file('index.html')


# -------------------------------- API ROUTES (Auth) ----------------------------------

@app.route('/api/signup', methods=['POST'])
def signup ():
    body = request.get_json()
    username = body['username']
    
    # Step 1: Check for duplicate username
    query = "SELECT count(id) as count FROM user WHERE username = ?"

    rv = query_db(query, [username], True)
    if (rv['count'] != 0):
        return {"username": username, "Error": "Username already exists!"}, 403
    
    # Step 2: Hash password and store in database
    password = body['password'] + PEPPER
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    query = "INSERT INTO user (username, password) VALUES (?, ?)"
    try:
        update_db(query, [username, hashed])
        token = new_token()
        # Get the assigned user id and the session token
        query = "SELECT id FROM user WHERE username = ?"
        id = query_db(query, [username], True)['id']
        session_tokens[id] = token
        resp = make_response({
            "status" : "success",
            "id" : id,
            "session_token" : token
        })
        resp.set_cookie("adamzhang22_current_user_id", str(id), domain='127.0.0.1')
        resp.set_cookie("adamzhang22_session_token", token, domain='127.0.0.1')
        return resp, 200
    except Exception as e:
        print(e)
        return {"username": username, "Error": "Something went wrong!"}, 403


@app.route('/api/login', methods=['POST'])
def login ():
    body = request.get_json()
    username = body['username']
    password = body['password']
    
    try:
        query = "SELECT id, password FROM user WHERE username=?"
        rv = query_db(query, [username], True)
        if (not rv):
            return {"Error" : "Login failed, check your username or password!"}, 401
        hashed= rv['password'].decode("utf-8")
        id = rv['id']
        if bcrypt.checkpw((password + PEPPER).encode('utf-8'), hashed.encode('utf-8')):
            token = new_token()
            session_tokens[id] = token
            resp = make_response({
                "status" : "success",
                "session_token" : token,
                "id" : id
            })
            resp.set_cookie("adamzhang22_current_user_id", str(id), domain='127.0.0.1')
            resp.set_cookie("adamzhang22_session_token", token, domain='127.0.0.1')
            return resp, 200
        return {"Error" : "Login failed, check your username or password!"}, 401
    except Exception as e:
        print(e)
        return {}, 403

# -------------------------------- API ROUTES (Channels and messages) ----------------------------------

@app.route('/api/channels', methods=['GET', 'POST'])
def channels ():
    
    # Get request parameters and session_id. If no session_id, return error
    
    user_id = request.cookies['adamzhang22_current_user_id']
    token = request.cookies['adamzhang22_session_token']
    if token != session_tokens[int(user_id)]:
        return {"Error" : "Incorrect token"}, 401


    if request.method == "GET":
        # Get list of channel names and unread message counts for each channel
        try:
            res = {"channels": []}
            query = "SELECT id, channel_name FROM channel"
            channels = query_db(query, [])
            for row in channels:
                channel_info = {}
                channel_name = row['channel_name']
                channel_id = row['id']
                channel_info['id'] = channel_id
                channel_info['name'] = channel_name
                # Check if user has read any message from the channel at all:
                query = "SELECT * FROM last_seen WHERE user_id = ? AND channel_id = ?"
                user_checked_channel = query_db(query, [user_id, channel_id], True)
                if (user_checked_channel):
                    # If user has read some message in the channel, check the last_seen table to get number of unread messages
                    query = "SELECT COUNT(message.id) AS unread FROM message\
                        INNER JOIN last_seen\
                        ON message.channel_id = last_seen.channel_id\
                        WHERE message.channel_id = ? AND last_seen.user_id = ? AND message.id > last_seen.last_message_id"
                    counts = query_db(query, [channel_id, user_id], True)
                    channel_info['unread'] = counts['unread']
                    res['channels'].append(channel_info)
                else:
                    # If user never checked the channel, simply return total number of messages in the channel
                    query = "SELECT COUNT(message.id) as count FROM message WHERE channel_id = ?"
                    counts = query_db(query, [channel_id], True)
                    channel_info['unread'] = counts['count']
                    res["channels"].append(channel_info)
            return res, 200
        except Exception as e:
            print(e)
            return {"Error": "Something went wrong, could not retrieve channel information!"}, 403
        
    elif request.method == "POST":
        body = request.get_json()
        channel_name = body['channel_name']
        if (not channel_name):
            return {"Error" : "Please supply a channel name in your request!"}, 403
        try:
            # Step 1: Check for duplicate channel names:
            query = "SELECT COUNT(id) as count FROM channel WHERE channel_name = ?"
            has_duplicate = query_db(query, [channel_name], True)['count'] > 0
            if (has_duplicate):
                return {"Error" : "Channel with same name already exist!"}, 403
            
            # Step 2: Create the channel!
            query = "INSERT INTO channel (channel_name) VALUES (?)"
            update_db(query, [channel_name])
            return {}, 200
        except Exception as e:
            print(e)
            return {"Error": "Something went wrong, could not create a new channel"}, 403

@app.route('/api/messages/<int:channel_id>', methods=['GET', 'POST'])
def messages (channel_id):

    user_id = request.cookies['adamzhang22_current_user_id']
    token = request.cookies['adamzhang22_session_token']
    if token != session_tokens[int(user_id)]:
        return {"Error" : "Incorrect token"}, 401
    
    if request.method == "GET":
        query = "SELECT m.id, m.content, u.username FROM message m\
                INNER JOIN user u\
                ON m.author_id = u.id\
                WHERE m.channel_id = ?"
        try:
            res = {"messages" : []}
            rv = query_db(query, [channel_id])
            for row in rv:
                # Need message_id, username, content, and number of reply
                message_info = {}
                message_info['id'] = row['id']
                message_info['content'] = row['content']
                message_info['username'] = row['username']
                query = "SELECT COUNT(id) as num FROM reply WHERE message_id = ?"
                num_reply = query_db(query, [message_info['id']], True)['num']
                message_info['num_reply'] = num_reply
                res["messages"].append(message_info)
            return res, 200
        except Exception as e:
            print(e)
            return {}, 403
            
    elif request.method == "POST":
        body = request.get_json()
        content = body["content"]
        query = "INSERT INTO message (channel_id, author_id, content) VALUES (?, ?, ?)"
        try:
            update_db(query, (channel_id, user_id, content))
            return {}, 200
        except Exception as e:
            print(e)
            return {"Error", "Could not send the message!"}, 403

@app.route("/api/message/<int:message_id>", methods=['GET'])
def message(message_id):
    user_id = request.cookies['adamzhang22_current_user_id']
    token = request.cookies['adamzhang22_session_token']
    if token != session_tokens[int(user_id)]:
        return {"Error" : "Incorrect token"}, 401
    
    try:
        query = "SELECT m.channel_id, m.content, u.username FROM message m\
                INNER JOIN user u\
                ON m.author_id = u.id\
                WHERE m.id = ?"
        rv = query_db(query, [message_id], True)
        message_info = {}
        message_info['channel_id'] = rv['channel_id']
        message_info['username'] = rv['username']
        message_info['content'] = rv['content']
        return message_info, 200
    except Exception as e:
        print(e)
        return {}, 403

@app.route('/api/replies/<int:message_id>', methods=['GET', 'POST'])
def replies(message_id):

    user_id = request.cookies['adamzhang22_current_user_id']
    token = request.cookies['adamzhang22_session_token']
    if token != session_tokens[int(user_id)]:
        return {"Error" : "Incorrect token"}, 401
    
    
    if request.method == "GET":
        query = "SELECT r.id, r.content, u.username FROM reply r\
                INNER JOIN user u\
                ON r.author_id = u.id\
                WHERE r.message_id = ?"
        try:
            rv = query_db(query, [message_id])
            res = {"replies": []}
            for row in rv:
                reply = {}
                reply['id'] = row['id']
                reply["author"] = row['username']
                reply["content"] = row['content']
                res["replies"].append(reply)
            return res, 200
        except Exception as e:
            print(e)
            return {"Error": "Somethign went wrong, could not get replies"}, 403
    
    elif request.method == "POST":
        body = request.get_json()
        content = body['content']
        query = "INSERT INTO reply (message_id, author_id, content) VALUES (?, ?, ?)"
        try:
            update_db(query, [message_id, user_id, content])
            return {}, 200
        except Exception as e:
            print(e)
            return {"Error": "Something went wrong, could not post reply"}, 403
        


@app.route("/api/last_seen", methods = ['POST'])
def update_last_seen():
    
    user_id = request.cookies['adamzhang22_current_user_id']
    token = request.cookies['adamzhang22_session_token']
    if token != session_tokens[int(user_id)]:
        return {"Error" : "Incorrect token"}, 401
    
    body = request.get_json()
    channel_id = body['channel_id']
    last_message_id = body['last_message_id']
    
    # Step 1: Check if the user has seen the channel at all
    query = "SELECT count(last_message_id) AS seen FROM last_seen WHERE user_id = ? AND channel_id = ?"
    try:
        seen = (query_db(query, [user_id, channel_id], True)['seen'] > 0)
    except Exception as e:
        print(e)
        return {"Error" : "Something went wrong, could not access database"}, 403
    
    # Step 2: If seen, update the last_seen message id, if not, insert new entry to database
    try:
        if (seen):
            query = "UPDATE last_seen SET last_message_id = ? WHERE user_id = ? AND channel_id = ?"
            update_db(query, [last_message_id, user_id, channel_id])
            return {}, 200
        else:        
            query = "INSERT INTO last_seen (user_id, channel_id, last_message_id) VALUES (?, ?, ?)"
            update_db(query, [user_id, channel_id, last_message_id])
            return {}, 200
    except Exception as e:
        print(e)
        return {"Error": "Something went wrong, could not update last seen message"}, 403