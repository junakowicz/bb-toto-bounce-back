# bb-toto-bounce-back

## Local development

Using Vagrant and an official Ubuntu box designed for Virtualbox.

Ansible provisioning for Vagrant.

Nodejs for bot.

### Installation (Mac OS X)

Install Homebrew:

`/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

Install Homebrew cask:

`brew tap caskroom/cask`

Install Vagrant and Virtualbox:

`brew cask install vagrant virtualbox`

Build and launch local dev environment:

`vagrant up`

### Bot

Watch logs:

`vagrant ssh -c "tail -f /home/ubuntu/.config/lotto-bot/log.txt"`

### Ansible

Downloading new roles is done through vagrant (unless you have Ansible installed on the host).

`vagrant ssh -c "ansible-galaxy install --roles-path /vagrant/roles username.role"`

Where `username.role` is as per https://galaxy.ansible.com/

This will download to the roles directory shared between the vagrant guest and the repo on the host.


# lottery Bounce Back

This chatbot helps to run "Bounce Back Lottery".

## Run
```sh
node toto.js 2>errlog
```

## Customize

TOR is recommended since you are keeping your private keys online and don't want your IP address to be known. See [core documentation about TOR](../../../byteballcore#confsockshost-confsocksport-and-confsockslocaldns).
