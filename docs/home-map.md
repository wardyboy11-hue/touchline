# Page map, release 112

Built on the home feed. Every existing screen stays. Find is on every page and uses this list plus the command registry.

## How taps are counted

One tap is a main tab: Home, Games, Events, Media, Me for families, and Today, Match, Train, Library, Team for coaches. A second tap is the labelled button on that section, or a Find result. Nothing in this list needs a third tap.

Phone tabs sit on the bottom with words, not icons alone. From 900 pixels wide the same tabs are a left rail and the page keeps a left margin so the rail does not cover the content.

The first strong button on a page is the primary action. Resource rows use a card with a preview area, a title, View and Share. Long clip and library lists show eight items, then Show more.

## Coach

| Task | Where it lives now | Taps from Today | Opens |
| --- | --- | --- | --- |
| Today | Home | 1 | today |
| Matches | Match | 1 | match |
| Training | Train | 1 | run |
| Library | Library | 1 | rl |
| Team | Team | 1 | squad |
| Set kit | Match | 2 | match |
| Match alert | Match | 2 | match |
| Attendance | Train | 2 | att |
| Role cards | Library | 2 | roles |
| Man of the match | More | 2 | more |
| Questions and player voice | Home | 1 | today |
| Comms | Comms | 2 | hub |
| Welfare | Team | 2 | admin |
| Head injury | Team | 2 | conc |
| Emergency contacts | Team | 2 | em |
| Team sheet | Team | 2 | fa |
| Player goals | Team | 2 | goals |
| Privacy | Team | 2 | priv |
| Team builder | Team | 2 | lab |
| Stats | Team | 2 | stats |
| Club contacts | Team | 2 | ct |
| This week plan | Train | 2 | plan |
| Session builder | Train | 2 | sb |
| Tonight | Train | 2 | run |
| Saved sessions | Train | 2 | sess |
| Reflect | Train | 2 | rev |
| Fitness | Train | 2 | fit |
| Tactics board | Train | 2 | board |
| Animations | Library | 2 | anim |
| 352 animation | Library | 2 | anim |
| Resources | Library | 2 | res |
| Positions | Library | 2 | pos |
| Clips | Library | 2 | lib |
| Listen | Library | 2 | pod |
| Ask | Comms | 2 | ask |
| Referees | Comms | 2 | refs |
| Opposition | Comms | 2 | opp |
| League | Comms | 2 | lg |
| Club shop | More | 2 | shop |
| Guides | More | 2 | guides |
| Access codes | More | 2 | more |

Before this tidy, Train hid Library, Tonight and Plan behind a second mode switch, so some pages were three taps. Those buttons are now all on the Train page in three labelled groups.

## Parent

| Task | Group | Taps from Home | Opens |
| --- | --- | --- | --- |
| Home | Home | 1 | home |
| Games | Games | 1 | games |
| Events | Events | 1 | events |
| Media | Media | 1 | media |
| Me | Me | 1 | me |
| Kit | Games | 2 | games |
| Lifts | Games | 2 | games |
| Attendance | Home | 1 | home |
| Role card | Me | 2 | me |
| Vote | Me | 2 | me |
| Wake up time | Games | 2 | games |
| Clips | Media | 2 | lib |
| 352 animation | Media | 2 | media |
| Stretching | Me | 2 | me |
| Club shop | Me | 2 | me |
| Contacts | Me | 2 | contacts |
| FAQ | Me | 2 | faq |
| My data | Me | 2 | data |
| Player card | Me | 2 | child |
| Ask the coaches | Me | 2 | pq |
| Podcasts | Media | 2 | media |

Before, FAQ, contacts, clips, stretching, the shop and My data lived in a More overlay. They are now listed in words on Me, and Find reaches them from any page.

## Player

| Task | Group | Taps from Home | Opens |
| --- | --- | --- | --- |
| Home | Home | 1 | home |
| Games | Games | 1 | games |
| Events | Events | 1 | events |
| Media | Media | 1 | media |
| Me | Me | 1 | me |
| Kit | Games | 2 | games |
| Lifts | Games | 2 | games |
| Attendance | Home | 1 | home |
| Role card | Me | 2 | me |
| Vote | Me | 2 | me |
| Clips | Media | 2 | lib |
| 352 animation | Media | 2 | media |
| Stretching | Me | 2 | me |
| Club shop | Me | 2 | me |
| Contacts | Me | 2 | contacts |
| FAQ | Me | 2 | faq |
| Ask the coaches | Me | 2 | pq |
| Your voice | Me | 2 | voice |
| My goals | Me | 2 | own |
| Podcasts | Media | 2 | media |

Your voice and My goals were in the same More overlay. They are on Me, and Find reaches them. A player cannot open coach welfare.

## Guidance

Nielsen Norman Group, mobile navigation: a small set of tabs for the main places, and search when there are more destinations than fit in the bar. https://www.nngroup.com/articles/mobile-navigation-patterns/

Material Design navigation bar: one set of top level destinations. https://m3.material.io/components/navigation-bar/overview

Apple Human Interface Guidelines, tab bars: text labels, and targets large enough to tap with one hand. https://developer.apple.com/design/human-interface-guidelines/tab-bars

## What stayed

Matchday cache name `tl-matchday` is unchanged. The 352 page still shows the pitch before voice files download. Questions and player voice still lead the coach home. Replies still need Send, and Cancel still sends nothing.

## Rollback

Version 112. Revert this pull request to return to the home feed release at version 111.
