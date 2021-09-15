/*
 * =============================================================================================
 * ||                                                                                          ||
 * ||                       VOTE + 1 STAR TO THIS REPOSITORY FOR ME THANKS U                   ||
 * ||                                                                                          ||
 * =============================================================================================
 */

const Web3 = require('web3');
const provider = "provider";
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

const MonsterInfo = require("./monster_info");
var CronJob = require('cron').CronJob;
const MONSTER_IN_ONE_MAP = 19;

const SIM_DECIMAL = 18;

const ANIMAL_ADDRESS = "0x43bAB1A12dB095641CC8B13c3B23347FA2b3AAa4";
const ANIMAL_ABI = require("./animal_abi.json");
const CONTRACT_ANIMAL = new web3.eth.Contract(ANIMAL_ABI, ANIMAL_ADDRESS);
var moment = require('moment');

const BATTLE_ADDRESS = "0xFA1a16288ecB0c2844Dd388cfb5f1EFdcE5f4A91";
const BATTLE_ABI = require("./battle_abi.json");
const CONTRACT_BATTLE = new web3.eth.Contract(BATTLE_ABI, BATTLE_ADDRESS);

const TelegramBot = require('node-telegram-bot-api');

const token = 'bot_token';
const bot = new TelegramBot(token, {
  polling: true
});

// ======= Winning Rewards =======
// 🔴 Low --- 🟠 Medium --- 🟢 High
//
// Chain: Polygon (Matic)
// Auto Refresh: 5 seconds
//
// 🔴 Bat - 0.056 SIM  (🙍‍♂0)
// 🔴 Boar - 0.106 SIM  (🙍‍♂0)
// 🔴 Golem - 0.222 SIM  (🙍‍♂0)
// 🟢 Dinosaur - 0.607 SIM  (🙍‍♂5)
// 🔴 Ice Golem - 0.98 SIM  (🙍‍♂2)
// 🔴 Orc - 1.73 SIM  (🙍‍♂6)
// 🔴 Skeleton - 5.975 SIM  (🙍‍♂4)
// 🟢 Turtle - 17.578 SIM  (🙍‍♂3)
// 🟠 Witcher - 29.096 SIM  (🙍‍♂6)
// 🟠 Worm - 61.961 SIM  (🙍‍♂7)
// 🔴 Wolf - 79.967 SIM  (🙍‍♂5)
// 🟢 Zombie - 176.741 SIM  (🙍‍♂1)
// 🔴 Ape - 198.374 SIM  (🙍‍♂5)
// 🔴 Jungle Ghost - 466.032 SIM  (🙍‍♂5)
//


module.exports = {
  async run() {
    var that = this;

    var that = this;
    new CronJob('*/5 * * * * *', async function() {
      var utcMoment = moment.utc();
      var monsters = await that.fetchMonsters();
      var low = "🔴";
      var medium = "🟠";
      var high = "🟢";

      var str_winning = "<b>======= Winning Rewards =======</b> \n\n";
      str_winning += "<b>🔴 Low --- 🟠 Medium --- 🟢 High</b> \n\n";
      str_winning += "Chain: <b>Polygon (Matic)</b> \n";
      str_winning += "Auto Refresh: <b>5 seconds</b> \n";
      str_winning += `Latest update: <b>${utcMoment.format('HH:mm:ss')}</b> (UTC) \n\n`;
      monsters.forEach((item, i) => {
        var type = low;
        if (item.level_reward == 0) type = low;
        else if (item.level_reward == 1) type = medium;
        else type = high;
        str_winning += `${type} <b>${item.name}</b> - <b>${item.prize}</b> SIM \n\n`;
      });


      bot.editMessageText(str_winning, {
        chat_id: "-1001538798989",
        message_id: "7",
        disable_web_page_preview: true,
        disable_notification: false,
        parse_mode: "HTML"
      });
    }, null, true, 'America/Los_Angeles').start();
  },


  async fetchMonsters() {
    const monsterFightLimitPerDay = await CONTRACT_BATTLE.methods.monsterFightLimitPerDay().call();
    const data = await CONTRACT_BATTLE.methods.getMonsters().call();
    const json = await this.getMonsterMaps(data);
    json.sort(function(a, b) {
      return a.power - b.power;
    });
    return json;
  },

  async getMonsterMaps(rawData) {
    const totalMaps = Math.ceil(rawData.length / MONSTER_IN_ONE_MAP);
    var that = this;
    if (rawData.length < MONSTER_IN_ONE_MAP) {
      return Promise.all(rawData.map(async e => {
        var level_reward = e.fightCount % 300;
        if (e.fightCount == 0) level_reward = 2; // HIGH
        if (level_reward <= 100) level_reward = 2; // HIGH
        else if (level_reward > 100 && level_reward <= 200) level_reward = 1; //MEDIUM
        else level_reward = 0; //LOW
        var power = that.cryptoConvert('decode', e.power, 18);

        var prize = await CONTRACT_BATTLE.methods.getPrize({
          id: e.id,
          cl: e.cl,
          map: 1,
          power: parseInt(power * 1000000),
          active: true
        }).call();

        return {
          id: e.id,
          level_reward: level_reward,
          name: MonsterInfo[parseInt(e.id)].name,
          prize: prize / 1000000,
          power: power
        };
      }));
    }

    let i, j, monsterRaw = [],
      maps = [];
    for (i = 0, j = rawData.length; i < j; i += MONSTER_IN_ONE_MAP) {
      const array = rawData.slice(i, i + MONSTER_IN_ONE_MAP);
      maps.push(array);
    }

    let currentMap = DateTimeUtils.getRangeHour(new Date().getHours(), 7, 4);

    if (maps[currentMap - 1]) monsterRaws = maps[currentMap - 1];

    else {
      currentMap = 1;
      monsterRaws = maps[0];
    }


    return Promise.all(monsterRaws.map(async e => {
      var level_reward = e.fightCount % 300;
      if (e.fightCount == 0) level_reward = 2; // HIGH
      if (level_reward <= 100) level_reward = 2; // HIGH
      else if (level_reward > 100 && level_reward <= 200) level_reward = 1; //MEDIUM
      else level_reward = 0; //LOW
      var power = that.cryptoConvert('decode', e.power, 18);
      var prize = await CONTRACT_BATTLE.methods.getPrize({
        id: e.id,
        cl: e.cl,
        map: 1,
        power: parseInt(power * 1000000),
        active: true
      }).call();

      return {
        id: e.id,
        level_reward: level_reward,
        name: MonsterInfo[parseInt(e.id)].name,
        prize: prize / 1000000,
        power: power
      };
    }));
  },

  cryptoConvert(type, amount, decimals, ) {
    if (type === 'decode') {
      return (amount) / +("1" + new Array(+decimals).fill(0).toString().replace(/,/g, ''));
    }
    const scale = +decimals - (amount.toString().split('.')[1].length || 0);
    let output = amount.toString();
    for (let i = 0; i < scale; i++) output += '0';
    output = output.replace('.', '');
    if (output[0] === "0") output = output.slice(1, output.length)
    return output;
  },

  async getPriceBuy(level) {
    const data = await CONTRACT_ANIMAL.methods.SIMBA_PRICES(level).call();
    var result = +this.cryptoConvert('decode', data, SIM_DECIMAL);
    return result;
  },

  getPower(json, priceBuy) {
    const totalQualities = +json.ag + +json.hp + +json.it + +json.st + +json.mp;
    const value = parseFloat(priceBuy + (priceBuy * totalQualities) / 714);
    return +(value.toFixed(6));
  },

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  },
}
