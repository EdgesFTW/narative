// import * as d3 from "./d3.v7.min.js";
console.log("Starting JS");

const data = (await d3.csv("gpa_by_year.csv")).filter((ele) => {
  if (ele["Year"] === "2024") {
    return false;
  }
  return true;
});

const academic_units_color = {
  "Grainger": "#f59e0b",
  "LAS": "#84cc16",
  "FAA": "#06b6d4",
  "Education": "#3b82f6",
  "Gies": "#a855f7",
  "ACES": "#f43f5e",
  "Other": "#a21caf",
  "iSchool": "#0369a1",
  "Media": "#047857",
  "Applied Health Sciences": "#854d0e",
  "LER": "#991b1b",
  "Vet Med": "#fda4af",
};

function get_gradepoints(course) {
  let value = 0;
  value += course["A+"] * 12 / 3;
  value += course["A"] * 12 / 3;
  value += course["A-"] * 11 / 3;
  value += course["B+"] * 10 / 3;
  value += course["B"] * 9 / 3;
  value += course["B-"] * 8 / 3;
  value += course["C+"] * 7 / 3;
  value += course["C"] * 6 / 3;
  value += course["C-"] * 5 / 3;
  value += course["D+"] * 4 / 3;
  value += course["D"] * 3 / 3;
  value += course["D-"] * 2 / 3;
  value += course["F"] * 0 / 3;
  return value;
}

function create_averages() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  let svg = d3.select("svg#first-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));
  }

}

function create_lowest() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes
    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gpa = [];
      }
      let cur_gpa = get_gradepoints(academic_units[key][i]) / academic_units[key][i]["Num Students"];
      year_stats[year].gpa.push(cur_gpa);
    }
    for (let year in year_stats) {
      let cur = year_stats[year].gpa.sort()[0];
      year_stats[year].gpa = cur;
      if (cur < min_gpa) {
        min_gpa = cur;
      }
      if (cur > max_gpa) {
        max_gpa = cur;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa)); // sort and take the min ele


  let svg = d3.select("svg#second-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Minimum GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));
  }
}

function createLegends() {
  const width = 928;
  const height = 100;
  const cols = 4;
  const entryWidth = 240;
  const entryHeight = 20;
  const marginTop = 30;
  const marginLeft = 40;

  const legendRadius = 8;

  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  function addToSvg(svg) {
    let i = 0;
    for (let key in academic_units) {
      let row = i / cols;
      let col = i % cols;

      svg.append("circle")
        .attr("cx", entryWidth * col + marginLeft)
        .attr("cy", row * entryHeight - legendRadius * 0.7 + marginTop)
        .attr("r", legendRadius)
        .style("fill", academic_units_color[key]);
      svg.append("text")
        .attr("x", entryWidth * col + 30 + marginLeft)
        .attr("y", row * entryHeight + marginTop)
        .text(key)
        .style("font-size", "15px")
        .attr("fill", "currentColor")
      i += 1;
    }
  }

  let first = d3.select("svg#first-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(first);

  let second = d3.select("svg#second-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(second);

}

create_averages();
create_lowest();
createLegends();


