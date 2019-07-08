
class SessionList {

    static registerSession(session) {
        if (session.id in SessionList.list) {
            throw "Session id already in use";
        }
        SessionList.list[session.id] = session;
    }

    static unregisterSession(session) {
        delete(SessionList.list[session.id]);
    }

    static findSession(sessionId) {
        return SessionList.list[sessionId];
    }
}
SessionList.list = {};

module.exports = SessionList;
