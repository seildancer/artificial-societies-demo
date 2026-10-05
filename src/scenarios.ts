import type { Metrics, Outcome, StoryEvent } from './data';

const post = (node: number, author: string, text: string, reaction: string, impact: string, kind: string) => ({ node, author, text, reaction, impact, kind });
type Post = ReturnType<typeof post>;
export interface Scenario {
  title: string; hook: string; context: string; incident: string; known: string; unknown: string; claim: string;
  crisis: Metrics; rumour: Post[]; outcomes: Outcome[];
}
const metrics = (supportive: number, hostile: number, belief: number, reach: number): Metrics => ({ supportive, hostile, belief, reach });
const response = (id: Outcome['id'], title: string, short: string, wording: string, result: Metrics, insight: string, explanations: string[], reactions: Post[]): Outcome => ({ id, title, short, response: wording, metrics: result, insight, explanations, reactions });
export const scenarios: Scenario[] = [
  {
    title: 'A-list actor', hook: 'Fired a junior staffer', context: 'an awards-season favourite',
    incident: 'A 12-second backstage clip shows the actor pushing a junior staffer’s phone down: “Are you serious? Put that away. You’re done here.” She walks away visibly upset.',
    known: 'The confrontation is visible. The clip has no footage before or after it.',
    unknown: 'Whether she lost her job, why she was filming, and whether other stories are accurate.',
    claim: 'The actor fired the junior staffer.', crisis: metrics(9, 71, 76, 100),
    rumour: [
      post(2, 'After Hours · gossip account', 'The actor just FIRED a junior assistant for filming backstage. Watch the last three seconds.', '850K views · “You’re done here” becomes “you’re fired”', 'The clip shows a confrontation, not a dismissal.', '01 / The inference'),
      post(146, 'Former production assistant', 'Worked with the actor in 2024. Can’t say this surprises me.', 'Replies: “So this is a pattern?”', 'A vague recollection is treated as corroboration.', '02 / Social proof'),
      post(147, 'Former co-star', 'You learn everything about someone by watching how they treat people below them.', '3.8M views · The actor is never mentioned directly', 'A famous voice makes the interpretation feel confirmed.', '03 / Celebrity amplification'),
      post(1, 'The Daily Cut · entertainment news', 'MULTIPLE CREW MEMBERS ACCUSE A-LIST ACTOR OF ROUTINELY FIRING JUNIOR STAFF OVER MINOR MISTAKES.', 'An anonymous coffee-order anecdote joins the original clip', 'One confrontation becomes a career-long reputation.', '04 / The mutation'),
    ],
    outcomes: [
      response('denial', 'Defend the context', 'Explain the rule; dispute the accusations.', 'The clip leaves out important context. A serious confidentiality rule had been broken. I regret my tone, but many of the claims now circulating are simply false.', metrics(8, 81, 79, 148), 'The explanation becomes a second accusation.', ['“A serious confidentiality rule” puts responsibility on the junior employee.', 'The staffer disputes that premise. Her reply becomes the new story.', 'A vague denial lets former colleagues read it as an attack on their own accounts.'], [
        post(170, 'Junior staffer', 'A “serious confidentiality rule”? My supervisor told me to record that clip.', 'The person in the video replies directly', 'The disputed justification renews attention.', '02 / The staffer replies'),
        post(146, 'Former production assistant', 'This is exactly what he does: turns his behavior into your mistake.', 'The earlier vague post is shared again', 'The response reinforces the alleged pattern.', '03 / The pattern returns'),
        post(1, 'The Daily Cut · entertainment news', 'A-LIST ACTOR BLAMES JUNIOR STAFFER AS BACKLASH GROWS.', 'The response displaces the original clip', 'More hostility; the firing claim remains intact.', '04 / A new headline'),
      ]),
      response('apology', 'Own the behaviour', 'Apologise for the moment people witnessed.', 'I spoke to a junior member of our team disrespectfully. Whatever had happened beforehand, she didn’t deserve that. I’ve apologized privately.', metrics(24, 49, 65, 112), 'The apology cools anger, but leaves the firing story alive.', ['Acknowledging the visible harm gives observers a reason to soften.', 'The wording does not say whether anyone was fired.', 'Fans call for closure while former staff keep the wider story in circulation.'], [
        post(170, 'Junior staffer', 'He did reach out. I appreciate him acknowledging how he spoke to me.', 'The apology is acknowledged', 'The immediate conflict loses heat.', '02 / Acknowledgement'),
        post(46, 'Spotlight Archive · fan account', 'He apologized. Everyone needs to move on now.', 'Supporters share the apology as closure', 'Fans and critics disagree about what is resolved.', '03 / A rush to closure'),
        post(115, 'Unfiltered · culture commentator', 'Why only apologize for the clip and ignore what former staff are saying? Was she fired or not?', 'The unanswered question survives', 'Less anger does not mean less belief.', '04 / The missing answer'),
      ]),
      response('statement', 'Apologise + rebut', 'Own the conduct; challenge the firing claim.', 'I spoke to her disrespectfully, and that was wrong. I’ve apologized to her privately. She was not fired, and claims that I routinely fire or intimidate staff are false.', metrics(35, 38, 23, 128), 'The firing rumour fades. Questions about his conduct survive.', ['The statement separates the witnessed behaviour from the inferred dismissal.', 'The staffer confirms the narrow correction, making it easier to repeat.', 'Denying a wider pattern cannot erase former colleagues’ experiences.'], [
        post(170, 'Junior staffer', 'He contacted me before posting this. I appreciate the apology. And no, I wasn’t fired.', 'The original staffer confirms the correction', 'The most concrete rumour loses credibility.', '02 / First-hand clarification'),
        post(0, 'ScreenWire · entertainment news', 'Staffer confirms she was not fired after the actor apologizes for backstage confrontation.', 'Outlets update the central claim', 'The correction travels, bringing fresh attention too.', '03 / The correction spreads'),
        post(146, 'Former production assistant', 'Glad he apologized to her. My experience with him was still awful, and I’m not taking that back.', 'Former colleagues resist a clean ending', 'The debate shifts from dismissal to behaviour.', '04 / What remains'),
      ]),
    ],
  },
  {
    title: 'Global pop star', hook: 'Kicked out a child fan', context: 'a sold-out world tour',
    incident: 'In a distant hotel-lobby video, the pop star appears to say “Can you get them out of here?” Security then asks a 13-year-old fan and her mother to leave the area. Her mother, a TV personality with 600K followers, says they were thrown out for asking for a photo.',
    known: 'Security moved the family away. The mother has posted her account.',
    unknown: 'Who the pop star was referring to, what happened beforehand, and what security was told.',
    claim: 'The pop star personally ordered a child fan removed.', crisis: metrics(14, 68, 72, 100),
    rumour: [
      post(46, 'Spotlight Archive · fan account', 'The pop star had a 13-year-old girl KICKED OUT for asking for a selfie. Her own mother posted about it.', 'The mother’s account spreads through fan communities', 'An unclear instruction becomes a personal order.', '01 / Fan amplification'),
      post(171, 'Lifestyle creator', 'Imagine becoming so famous you can’t show basic kindness to a child.', '2.4M views · Anger crosses beyond music fans', 'The argument becomes about character.', '02 / Moral framing'),
      post(115, 'Unfiltered · anti-fan account', '“Sometimes I genuinely hate being recognized.” Well this aged perfectly.', 'A two-year-old interview resurfaces', 'A remark about paparazzi is reframed as contempt for fans.', '03 / Context stripped away'),
      post(172, 'LobbyWitness · unverified guest', 'I was there. The family had approached her more than once.', 'Replies: “Oh, so now we’re blaming a CHILD?”', 'A counterclaim deepens the split over boundaries.', '04 / Competing camps'),
    ],
    outcomes: [
      response('denial', 'Defend boundaries', 'Explain why security intervened.', 'I love meeting fans, but everyone deserves boundaries in private spaces. Security intervened after repeated approaches despite being asked to stop.', metrics(20, 75, 79, 157), 'A defence of boundaries turns into a dispute with a mother.', ['The claim of repeated approaches gives the mother a specific point to challenge.', 'Some supporters agree about privacy, but critics hear blame directed at a child.', 'The mother’s rebuttal becomes the next viral post.'], [
        post(170, 'The fan’s mother', 'Repeated approaches? My daughter walked toward you once.', 'Her reply travels beyond her 600K followers', 'A disputed detail becomes the centre of the story.', '02 / A direct challenge'),
        post(46, 'Spotlight Archive · fan account', 'She is allowed a private life. Being a fan doesn’t buy access to her hotel.', 'Fans rally around boundaries', 'Support hardens without resolving what happened.', '03 / Supporters mobilise'),
        post(171, 'Lifestyle creator', 'She’s doubling down and blaming a 13-year-old. This was your chance to be kind.', 'The boundary argument becomes a character test', 'More attention, more hostility, no factual resolution.', '04 / The frame hardens'),
      ]),
      response('apology', 'Lead with empathy', 'Acknowledge the family’s hurt.', 'No child should leave an interaction with my team feeling humiliated. I’m sorry to her and her family.', metrics(32, 43, 69, 108), 'The temperature falls. The personal-order claim sticks.', ['The statement recognises the family’s experience without arguing over details.', 'It does not distinguish the pop star’s intent from the security team’s actions.', 'Some people read the apology as confirmation of the original allegation.'], [
        post(170, 'The fan’s mother', 'Thank you for saying this. My daughter just wanted to know she hadn’t done something wrong.', 'The mother welcomes the apology', 'The emotional conflict begins to settle.', '02 / A softer exchange'),
        post(115, 'Unfiltered · culture commentator', 'So she admits it happened. At least she finally apologized.', 'An apology is read as an admission', 'The strongest inference goes uncorrected.', '03 / An unintended reading'),
        post(46, 'Spotlight Archive · fan account', 'She apologized. What else do people want? Please let the family move on too.', 'Fewer reasons to keep arguing', 'Attention cools faster than the rumour fades.', '04 / Uneven recovery'),
      ]),
      response('statement', 'Clarify + take responsibility', 'Deny the order; own the team’s actions.', 'I didn’t ask for this family to be removed and wasn’t aware security had done so. But they represent me, and I’m sorry for how this was handled.', metrics(39, 34, 28, 137), 'The accusation weakens. Supporters create a new problem.', ['Intent and responsibility are addressed separately.', 'The mother accepts the outreach without endorsing the security team’s conduct.', 'Fans weaponise the clarification against her, extending the reputational risk.'], [
        post(170, 'The fan’s mother', 'I appreciate her reaching out. I still think her team handled this terribly.', 'The dispute narrows to the security response', 'A route out of the personal accusation opens.', '02 / Partial resolution'),
        post(46, 'Spotlight Archive · fan account', 'She never ordered it. The mother owes HER an apology for starting all of this.', 'Supporters turn a correction into an attack', 'The fan community creates a second conflict.', '03 / Supporter backlash'),
        post(170, 'The fan’s mother', 'I accepted her apology. Her fans apparently haven’t. Please stop messaging my family.', 'Harassment becomes the remaining story', 'Improved sentiment still carries a human cost.', '04 / The new liability'),
      ]),
    ],
  },
  {
    title: 'Actor & studio founder', hook: 'Hires based on looks', context: 'a growing independent production studio',
    incident: 'At a private party, the studio founder is filmed saying: “Come on, we don’t hire ugly people. Nobody wants to look at that for twelve hours.” People laugh. The 12-second clip goes viral.',
    known: 'The studio founder made the remark and people around her laughed.',
    unknown: 'Whether appearance has influenced hiring. The clip alone does not establish company policy.',
    claim: 'The studio founder’s company screens hires by appearance.', crisis: metrics(12, 66, 67, 100),
    rumour: [
      post(1, 'The Daily Cut · entertainment news', 'STUDIO FOUNDER SAYS HER COMPANY DOESN’T HIRE “UGLY PEOPLE”.', '5.2M views · The party setting drops out of the headline', 'A remark is treated as a statement of hiring policy.', '01 / The literal headline'),
      post(146, 'Former intern', 'Suddenly some things about my internship make sense.', 'Replies fill in details the post never supplies', 'An ambiguous experience becomes implied evidence.', '02 / Implied corroboration'),
      post(147, 'Former employee', 'For what it’s worth, I worked there for two years and never saw hiring decisions made like this.', 'The intern replies: “Good for you?”', 'Competing experiences produce camps, not consensus.', '03 / Counter-testimony'),
      post(115, 'Unfiltered · workplace commentator', 'Everyone focusing on whether this was literally a hiring policy is missing the point. Imagine hearing your boss talk like this.', 'The debate moves from policy to workplace culture', 'A factual denial alone can no longer settle the argument.', '04 / The question changes'),
    ],
    outcomes: [
      response('denial', 'Explain the joke', 'Reject the claim about hiring.', 'It was an obviously stupid joke between friends at a private party. Our company has never hired or rejected anyone based on appearance.', metrics(18, 72, 38, 133), 'Belief in discrimination falls while anger grows.', ['The hiring denial answers the strongest factual allegation.', '“Obviously” and “private party” minimise the concern about leadership.', 'People can reject the policy rumour and still distrust the culture.'], [
        post(146, 'Former intern', 'Notice she apologized for nothing.', 'Former staff focus on the omission', 'The denial does not address the harm of the remark.', '02 / What went unsaid'),
        post(0, 'ScreenWire · entertainment news', 'Studio founder denies appearance-based hiring, calls viral remark a private joke.', 'Coverage carries the factual denial', 'The policy claim loses ground.', '03 / A narrower correction'),
        post(115, 'Unfiltered · workplace commentator', 'Calling it a joke doesn’t explain why everyone around her immediately laughed.', 'Workplace culture takes over the discussion', 'Less belief and more hostility can coexist.', '04 / The moral question'),
      ]),
      response('apology', 'Apologise for the harm', 'Name the cruelty and apologise to the team.', 'It was a cruel and shallow joke. I’m embarrassed that I said it, and I’m sorry to my team and to anyone who heard it.', metrics(29, 45, 62, 107), 'A sincere apology leaves a factual question unanswered.', ['Calling the remark cruel validates why employees were upset.', 'The apology never addresses actual hiring practices.', 'Silence about the allegation is read by some as evidence that it is true.'], [
        post(147, 'Former employee', 'I’m glad she said this. Nobody should have to wonder if their boss sees them that way.', 'The apology reaches people inside the industry', 'Acknowledging the harm softens moral criticism.', '02 / Acknowledging the harm'),
        post(115, 'Unfiltered · workplace commentator', 'She’s apologizing for the joke but still hasn’t addressed whether appearance affects hiring.', 'The unanswered allegation stays visible', 'Emotional repair does not settle the facts.', '03 / The unanswered question'),
        post(173, 'Casual viewer', 'If it genuinely wasn’t true, why won’t she say so?', 'Omission is treated as confirmation', 'The hiring rumour survives a warmer response.', '04 / Silence gets interpreted'),
      ]),
      response('statement', 'Acknowledge + clarify', 'Own the remark; explicitly address hiring.', 'It was an ugly joke, and I shouldn’t have said it. But I also want to address the claim now spreading from it: appearance is not and has never been a hiring criterion at our company.', metrics(34, 39, 26, 124), 'The policy rumour weakens. The culture question remains.', ['The response acknowledges the remark and challenges the inference separately.', 'Former employees can agree about policy while disagreeing about their experience.', 'A statement cannot establish what the workplace feels like to everyone.'], [
        post(146, 'Former intern', 'No written criterion, sure. That doesn’t mean appearance wasn’t part of the culture.', 'The criticism narrows without disappearing', 'The debate moves beyond formal policy.', '02 / A distinction challenged'),
        post(147, 'Former employee', 'I dislike the joke too, but people are now inventing a workplace they never experienced.', 'Former colleagues disagree in public', 'The audience sees competing accounts rather than consensus.', '03 / No single experience'),
        post(0, 'ScreenWire · entertainment news', 'Studio founder apologizes and denies appearance-based hiring. Former employees remain divided over studio culture.', 'Reporting separates the two questions', 'A factual correction leaves a reputational issue to address.', '04 / Two different questions'),
      ]),
    ],
  },
];
export function timedPosts(posts: Post[], times: number[]): StoryEvent[] {
  return posts.map((p, i) => ({ ...p, at: times[i], duration: 2.7, targets: i === 0 ? [3, 7] : [19 + i, 55 + i, 178 + i, 208 + i] }));
}
