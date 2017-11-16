CREATE TABLE lotto_bot_control (
    lotto_bot_control_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    status VARCHAR(10) NOT NULL, 
    device_address CHAR(33) NOT NULL, 
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lotto_bot_control (status, device_address) VALUES ('off', 'init');

CREATE TABLE lotto_bot_player (
    lotto_bot_player_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    nick_name VARCHAR(50) NOT NULL, 
    device_address CHAR(33) NOT NULL, 
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX byLottoBotPlayerNickName ON lotto_bot_player(device_address);
