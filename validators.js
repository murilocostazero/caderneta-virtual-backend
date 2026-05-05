const hasRealGrade = (ev) =>
    ev &&
    (
        ev.monthlyExam != null ||
        ev.bimonthlyExam != null ||
        ev.qualitativeAssessment != null ||
        ev.bimonthlyAverage != null
    );

module.exports = hasRealGrade;