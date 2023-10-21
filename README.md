# Interacties

This is my first official individual project!

My goal for this is to create a browser based OBS overlay for a livestream.

The license is quite restrictive \(CC BY-NC-ND 4.0\) at this point because this project is my baby, but will likely be less restrictive once it matures.

## Features:
- [x] Beat Saber rank pulled from ScoreSaber API
- [x] Heart-rate scraped from Pulsoid
- [x] Timed animations
- [x] Modular component use based on parameters set on page call
- [x] Settings in a config file
- [X] Chat integration
- [ ] User interface to toggle/use interactions and change settings
- [ ] Other interactions done via chat
- [ ] Setup instructions

Features and functionality are subject to change.

## Installation Requirements:

- Node.JS (latest)

## Setup

git clone https://github.com/Minisungam/Interacties.git
cd interacties
npm install
cp config_template.json config.json
npm run devStart