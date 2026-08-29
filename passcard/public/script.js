const levels = [
  ["Basic Card", "البطاقة الأساسية للمستخدمين الجدد."],
  ["Standard Card", "تخصيص وتصميمات أكثر."],
  ["Advanced Card", "أدوات وخيارات متقدمة."],
  ["Premium Card", "تصميمات حصرية ودعم مميز."],
  ["Elite Card", "تجربة احترافية وتخصيص كامل."],
  ["Ultra Elite Card", "تخصيص فاخر وحماية متقدمة."],
  ["MAX Card", "أعلى مستوى من PassCard."]
];

const container = document.getElementById("levels");

levels.forEach(([name, description]) => {
  const card = document.createElement("article");

  card.className = "card";
  card.innerHTML = `
    <h3>${name}</h3>
    <p>${description}</p>
  `;

  container.appendChild(card);
});
