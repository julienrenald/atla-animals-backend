
const db = require("../models/db");
const DailyRating = require("../models/DailyRating");
const { QueryTypes } =  require("sequelize");

const updateDailyAnimal = require("../funcs/updateDailyAnimal")
const checkVoter = require("../funcs/checkVoter");
const doRating = require("../funcs/doRating");

async function serveDailyAnimal(req, res) {
  
  const dailyQuery = `SELECT animals.name, animals.desc, usedAnimals.id AS uAId, usedAnimals.createdAt FROM animals, usedAnimals
    WHERE animals.id = usedAnimals.animalId
    ORDER BY usedAnimals.createdAt DESC
    LIMIT 1`;

  let dailyAnimal = await db.query(dailyQuery, {
    type: QueryTypes.SELECT
  })
  .catch(e => res.send(e));

  dailyAnimal = dailyAnimal[0];

  if(!dailyAnimal) {
    dailyAnimal = await updateDailyAnimal();
  }

  //Compare the daily animal's date with the current date
  const animalDate = new Date(dailyAnimal.createdAt);
  const animalYear = animalDate.getFullYear();
  const animalMonth = animalDate.getMonth();
  const animalDateDay = animalDate.getDate();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  //Update animal when dates don't match
  //Change this to cronjob later
  if(animalDateDay != currentDate || animalMonth != currentMonth || animalYear != currentYear) {
    dailyAnimal = await updateDailyAnimal()
    .catch(e => res.send(e));
  } 
  //Get daily rating for the daily animal
  else {
    dailyAnimal.tier = await doRating(dailyAnimal.uAId);
  }

  const hasVoted = await checkVoter(req);

  const { name, desc, tier } = dailyAnimal;

  res.send({
    name,
    desc, 
    tier,
    date: `${currentDate} / ${currentMonth + 1} / ${currentYear}`,
    hasVoted
  });
}

module.exports = serveDailyAnimal;