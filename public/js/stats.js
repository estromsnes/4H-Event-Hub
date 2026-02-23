// Statistics Dashboard JavaScript

let statsCharts = {};
let statsData = null;

// Load statistics when stats tab is opened
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }

        statsData = await response.json();
        renderStatistics(statsData);
    } catch (err) {
        console.error('Error loading statistics:', err);
        alert('Kunne ikke laste statistikk');
    }
}

function renderStatistics(data) {
    renderKPICards(data.kpis);
    renderActivityDistribution(data.activityDistribution);
    renderEngagementScore(data.engagement);
    renderActivityOverTime(data.activityOverTime);
    renderTeamComparison(data.teamComparison);
    renderAwards(data.awards);
    renderQuizInsights(data.quizInsights);
    renderTeamChallengeRecords(data.teamChallengeRecords);
    renderPhotoChallengeStats(data.photoChallenges);
    renderScavengerStats(data.scavengerHunt);
    renderTicTacToeStats(data.ticTacToe);
    renderLiveFeed(data.liveFeed);
}

// 1. KPI Cards
function renderKPICards(kpis) {
    const container = document.getElementById('kpiCards');

    const confirmedPercentage = kpis.totalParticipants > 0
        ? Math.round((kpis.confirmedParticipants / kpis.totalParticipants) * 100)
        : 0;

    const noShowPercentage = kpis.totalParticipants > 0
        ? Math.round((kpis.noShowParticipants / kpis.totalParticipants) * 100)
        : 0;

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">👥 Totalt deltakere</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.totalParticipants}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${kpis.participantsWithTeams} med lag</div>
        </div>
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">✅ Bekreftede deltakere</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.confirmedParticipants || 0}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${confirmedPercentage}% av totalt</div>
        </div>
        <div style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">❌ No-show deltakere</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.noShowParticipants || 0}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${noShowPercentage}% av totalt</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">🎯 Antall lag</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.totalTeams}</div>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">📱 QR-skanninger</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.totalScans}</div>
        </div>
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">🏆 Fullførte aktiviteter</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.totalCompletedActivities}</div>
        </div>
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">📸 Bilder lastet opp</div>
            <div style="font-size: 32px; font-weight: bold;">${kpis.totalPhotos}</div>
        </div>
    `;
}

// 2. Activity Distribution Pie Chart
function renderActivityDistribution(distribution) {
    const ctx = document.getElementById('activityDistributionChart');

    // Destroy existing chart if it exists
    if (statsCharts.activityDistribution) {
        statsCharts.activityDistribution.destroy();
    }

    statsCharts.activityDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Quiz', 'Samle laget', 'Bildeoppgaver', 'QR Skattejakt', 'Tripp-Trapp-Tresko'],
            datasets: [{
                data: [
                    distribution.quiz,
                    distribution.teamChallenge,
                    distribution.photoChallenges,
                    distribution.scavenger,
                    distribution.ticTacToe
                ],
                backgroundColor: [
                    '#667eea',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#fa709a'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' deltakere/lag';
                        }
                    }
                }
            }
        }
    });
}

// 9. Activity Over Time Line Chart
function renderActivityOverTime(timeData) {
    const ctx = document.getElementById('activityTimeChart');

    if (statsCharts.activityTime) {
        statsCharts.activityTime.destroy();
    }

    // Prepare data for all 24 hours
    const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
    const scanCounts = hours.map(hour => {
        const found = timeData.scansPerHour.find(s => s.hour === hour);
        return found ? found.count : 0;
    });

    statsCharts.activityTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours.map(h => h + ':00'),
            datasets: [{
                label: 'QR-skanninger',
                data: scanCounts,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 13. Engagement Score
function renderEngagementScore(engagement) {
    const ctx = document.getElementById('engagementChart');

    if (statsCharts.engagement) {
        statsCharts.engagement.destroy();
    }

    const topTeams = engagement.slice(0, 10);

    statsCharts.engagement = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTeams.map(t => t.team),
            datasets: [{
                label: 'Engasjement-score',
                data: topTeams.map(t => t.score),
                backgroundColor: topTeams.map((_, i) => {
                    const colors = ['#43e97b', '#4facfe', '#667eea', '#f093fb', '#fa709a'];
                    return colors[i % colors.length];
                }),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const team = topTeams[context.dataIndex];
                            return [
                                `Quiz: ${team.activities.quiz}`,
                                `Samle laget: ${team.activities.teamChallenge}`,
                                `Skattejakt: ${team.activities.scavenger}`,
                                `Bildeoppgaver: ${team.activities.photo}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// 14. Team Comparison Radar Chart
function renderTeamComparison(teams) {
    const ctx = document.getElementById('teamComparisonChart');

    if (statsCharts.teamComparison) {
        statsCharts.teamComparison.destroy();
    }

    // Take top 5 teams for readability
    const topTeams = teams.slice(0, 5);

    const datasets = topTeams.map((team, index) => {
        const colors = [
            'rgba(102, 126, 234, 0.6)',
            'rgba(240, 147, 251, 0.6)',
            'rgba(79, 172, 254, 0.6)',
            'rgba(67, 233, 123, 0.6)',
            'rgba(250, 112, 154, 0.6)'
        ];
        const borderColors = [
            'rgb(102, 126, 234)',
            'rgb(240, 147, 251)',
            'rgb(79, 172, 254)',
            'rgb(67, 233, 123)',
            'rgb(250, 112, 154)'
        ];

        return {
            label: team.team,
            data: [
                team.quizScore,
                team.photoPoints,
                team.teamChallengeTime,
                team.scavengerCheckpoints * 10, // Scale up for visibility
                team.ticTacToeWinRate
            ],
            backgroundColor: colors[index % colors.length],
            borderColor: borderColors[index % borderColors.length],
            borderWidth: 2
        };
    });

    statsCharts.teamComparison = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Quiz Score', 'Bildepoeng', 'Samle laget', 'Skattejakt', 'TTT Win %'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 120
                }
            }
        }
    });
}

// 11. Awards and Badges
function renderAwards(awards) {
    const container = document.getElementById('awardsContainer');

    const awardCards = [];

    // Speedster
    if (awards.speedster) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">🚀</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Speedster</div>
                <div style="text-align: center;">${awards.speedster.name}</div>
                <div style="text-align: center; opacity: 0.9; font-size: 14px;">${awards.speedster.team}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">${Math.floor(awards.speedster.minutes)} min</div>
            </div>
        `);
    }

    // Perfectionist
    if (awards.perfectionist) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">🎯</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Perfektionist</div>
                <div style="text-align: center;">${awards.perfectionist.name}</div>
                <div style="text-align: center; opacity: 0.9; font-size: 14px;">${awards.perfectionist.team}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">${awards.perfectionist.perfect_count} perfekte</div>
            </div>
        `);
    }

    // Shutterbug
    if (awards.shutterbug) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">📸</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Shutterbug</div>
                <div style="text-align: center;">${awards.shutterbug.team_name}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">${awards.shutterbug.photo_count} bilder</div>
            </div>
        `);
    }

    // Early Bird
    if (awards.earlyBird.teamChallenge) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #43e97b, #38f9d7); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">🦅</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Early Bird</div>
                <div style="text-align: center;">${awards.earlyBird.teamChallenge.team_name}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">Først: Samle laget</div>
            </div>
        `);
    }

    // Allrounder
    if (awards.allrounders && awards.allrounders.length > 0) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">🌟</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Allrounder</div>
                <div style="text-align: center;">${awards.allrounders.map(a => a.team).join(', ')}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">Alle aktiviteter</div>
            </div>
        `);
    }

    // Marathon Team
    if (awards.marathon) {
        awardCards.push(`
            <div style="background: linear-gradient(135deg, #30cfd0, #330867); color: white; padding: 20px; border-radius: 12px;">
                <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">🏃</div>
                <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px;">Marathon Team</div>
                <div style="text-align: center;">${awards.marathon.team}</div>
                <div style="text-align: center; opacity: 0.8; font-size: 12px; margin-top: 5px;">${awards.marathon.scan_count} skanninger</div>
            </div>
        `);
    }

    container.innerHTML = awardCards.length > 0 ? awardCards.join('') : '<p style="color: #999;">Ingen utmerkelser ennå</p>';
}

// 4. Quiz Insights
function renderQuizInsights(insights) {
    const container = document.getElementById('quizInsights');

    let html = `
        <div style="margin-bottom: 15px;">
            <strong>🎯 Perfekte scorer:</strong> ${insights.perfectScores || 0}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>⏱️ Snitt tid per spørsmål:</strong> ${insights.avgTimePerQuestion ? insights.avgTimePerQuestion.toFixed(1) : '0.0'} min
        </div>
    `;

    if (insights.hardestQuestion) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>🤔 Vanskeligste spørsmål:</strong><br>
                <span style="font-size: 14px;">"${insights.hardestQuestion.question_text}"</span><br>
                <span style="font-size: 12px; color: #999;">${insights.hardestQuestion.correct_percentage.toFixed(1)}% riktige</span>
            </div>
        `;
    }

    if (insights.easiestQuestion) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>✅ Letteste spørsmål:</strong><br>
                <span style="font-size: 14px;">"${insights.easiestQuestion.question_text}"</span><br>
                <span style="font-size: 12px; color: #999;">${insights.easiestQuestion.correct_percentage.toFixed(1)}% riktige</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

// 5. Team Challenge Records
function renderTeamChallengeRecords(records) {
    const container = document.getElementById('teamChallengeRecords');

    let html = '';

    if (records.fastest) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>⚡ Raskeste lag:</strong><br>
                ${records.fastest.team_name}<br>
                <span style="font-size: 12px; color: #999;">${formatTime(records.fastest.elapsed_time_seconds)}</span>
            </div>
        `;
    }

    if (records.slowest) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>🐌 Tregeste lag:</strong><br>
                ${records.slowest.team_name}<br>
                <span style="font-size: 12px; color: #999;">${formatTime(records.slowest.elapsed_time_seconds)}</span>
            </div>
        `;
    }

    html += `
        <div style="margin-bottom: 15px;">
            <strong>📊 Gjennomsnittstid:</strong> ${formatTime(records.avgTime || 0)}
        </div>
        <div>
            <strong>❌ Feilet forsøk:</strong> ${records.failed || 0}
        </div>
    `;

    container.innerHTML = html;
}

// 6. Photo Challenge Stats
function renderPhotoChallengeStats(stats) {
    const container = document.getElementById('photoChallengeStats');

    let html = `
        <div style="margin-bottom: 15px;">
            <strong>📸 Totalt innsendinger:</strong> ${stats.totalSubmissions || 0}
        </div>
    `;

    if (stats.topTeam) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>🏆 Flest poeng:</strong><br>
                ${stats.topTeam.team_name}<br>
                <span style="font-size: 12px; color: #999;">${stats.topTeam.total_points || 0} poeng</span>
            </div>
        `;
    }

    html += `
        <div style="margin-bottom: 15px;">
            <strong>📊 Snitt poeng:</strong> ${stats.avgPoints ? stats.avgPoints.toFixed(1) : '0.0'}
        </div>
    `;

    if (stats.mostPopular) {
        html += `
            <div>
                <strong>🌟 Mest populær:</strong><br>
                ${stats.mostPopular.title}<br>
                <span style="font-size: 12px; color: #999;">${stats.mostPopular.submission_count} innsendinger</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

// 7. Scavenger Hunt Stats
function renderScavengerStats(stats) {
    const container = document.getElementById('scavengerStats');

    let html = `
        <div style="margin-bottom: 15px;">
            <strong>📊 Snitt checkpoints:</strong> ${stats.avgCheckpoints ? stats.avgCheckpoints.toFixed(1) : '0.0'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>🏁 Fullførte alle:</strong> ${stats.completedAll || 0}
        </div>
    `;

    if (stats.mostPopular) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>🌟 Mest besøkt:</strong><br>
                ${stats.mostPopular.name}<br>
                <span style="font-size: 12px; color: #999;">${stats.mostPopular.scan_count} skanninger</span>
            </div>
        `;
    }

    html += `
        <div>
            <strong>⏱️ Gjennomsnittstid:</strong> ${formatTime(stats.avgTime || 0)}
        </div>
    `;

    container.innerHTML = html;
}

// 8. Tic-Tac-Toe Stats
function renderTicTacToeStats(stats) {
    const container = document.getElementById('ticTacToeStats');

    let html = `
        <div style="margin-bottom: 15px;">
            <strong>🎮 Totalt spill:</strong> ${stats.totalGames || 0}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>🤝 Uavgjorte:</strong> ${stats.totalDraws || 0}
        </div>
    `;

    if (stats.topPlayer) {
        html += `
            <div>
                <strong>🏆 Flest seire:</strong><br>
                ${stats.topPlayer.name}<br>
                <span style="font-size: 12px; color: #999;">${stats.topPlayer.wins || 0} seire</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

// 12. Live Feed
function renderLiveFeed(activities) {
    const container = document.getElementById('liveFeed');

    if (activities.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Ingen aktiviteter ennå</p>';
        return;
    }

    const activityIcons = {
        'quiz': '🧠',
        'team_challenge': '📸',
        'tic_tac_toe': '⭕'
    };

    const html = activities.map(activity => {
        const icon = activityIcons[activity.activity_type] || '🎯';
        const time = new Date(activity.timestamp).toLocaleTimeString('nb-NO', {hour: '2-digit', minute: '2-digit'});

        return `
            <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-size: 14px;">${activity.message}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 2px;">${time}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// Utility functions
function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadStatistics);
    }

    // Load statistics when stats tab is opened
    const statsTab = document.querySelector('[data-tab="stats"]');
    if (statsTab) {
        statsTab.addEventListener('click', () => {
            // Small delay to ensure tab content is visible
            setTimeout(loadStatistics, 100);
        });
    }
});
