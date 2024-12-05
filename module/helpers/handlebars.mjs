export default function registerHandlebarsHelpers() {
  Handlebars.registerHelper('chargeUp', function (values) {
    let accum = '';
    // var arrayValues = eval(values);
    for (let i = 1; i <= 6; ++i) {
      let checked = values.has(i) ? "checked" : "";
      accum += `<div class="grid-span-1">
      <input type='checkbox' name='system.chargeUp' value="${i}" ${checked} /> <label
      class='resource-label'>${i}</label>
      </div>`;
    }
    return accum;
  });
}